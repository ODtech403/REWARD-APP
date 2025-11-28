-- Add max_completions_per_user column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS max_completions_per_user INTEGER NOT NULL DEFAULT 1;

-- Update complete_task function to check max completions per user
CREATE OR REPLACE FUNCTION complete_task(
  p_user_id UUID,
  p_campaign_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_campaign RECORD;
  v_user_balance DECIMAL(10,4);
  v_reward_amount DECIMAL(10,4);
  v_cooldown_ends_at TIMESTAMPTZ;
  v_existing_cooldown TIMESTAMPTZ;
  v_new_balance DECIMAL(10,4);
  v_platform_commission DECIMAL(10,4);
  v_user_completion_count INTEGER;
BEGIN
  -- Lock the campaign row to prevent race conditions
  SELECT * INTO v_campaign
  FROM campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;

  -- Check if campaign exists and is active
  IF v_campaign IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error_message', 'Campaign not found'
    );
  END IF;

  IF v_campaign.status != 'active' THEN
    RETURN json_build_object(
      'success', false,
      'error_message', 'Campaign is not active'
    );
  END IF;

  -- Check if campaign has sufficient budget
  IF (v_campaign.total_budget - v_campaign.spent_amount) < v_campaign.cost_per_action THEN
    -- Mark campaign as depleted
    UPDATE campaigns SET status = 'depleted' WHERE id = p_campaign_id;
    RETURN json_build_object(
      'success', false,
      'error_message', 'Campaign budget depleted'
    );
  END IF;

  -- Check max completions per user
  SELECT COUNT(*) INTO v_user_completion_count
  FROM task_completions
  WHERE user_id = p_user_id
    AND campaign_id = p_campaign_id;

  IF v_user_completion_count >= v_campaign.max_completions_per_user THEN
    RETURN json_build_object(
      'success', false,
      'error_message', 'Maximum completions reached for this campaign'
    );
  END IF;

  -- Check for existing cooldown
  SELECT cooldown_ends_at INTO v_existing_cooldown
  FROM task_completions
  WHERE user_id = p_user_id
    AND campaign_id = p_campaign_id
    AND cooldown_ends_at > NOW()
  ORDER BY cooldown_ends_at DESC
  LIMIT 1;

  IF v_existing_cooldown IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error_message', 'Task is on cooldown',
      'cooldown_ends_at', v_existing_cooldown
    );
  END IF;

  -- Calculate amounts
  v_reward_amount := v_campaign.cost_per_action * 0.75;
  v_platform_commission := v_campaign.cost_per_action * 0.25;
  v_cooldown_ends_at := NOW() + (v_campaign.cooldown_seconds || ' seconds')::INTERVAL;

  -- Get current user balance
  SELECT wallet_balance INTO v_user_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  v_new_balance := v_user_balance + v_reward_amount;

  -- Update campaign spent amount and completion count
  UPDATE campaigns
  SET 
    spent_amount = spent_amount + v_campaign.cost_per_action,
    completed_count = completed_count + 1,
    status = CASE 
      WHEN (total_budget - spent_amount - v_campaign.cost_per_action) < v_campaign.cost_per_action 
      THEN 'depleted' 
      ELSE status 
    END
  WHERE id = p_campaign_id;

  -- Update user wallet balance
  UPDATE profiles
  SET wallet_balance = v_new_balance
  WHERE id = p_user_id;

  -- Create completion record
  INSERT INTO task_completions (
    user_id,
    campaign_id,
    cooldown_ends_at,
    reward_amount,
    ip_address,
    device_fingerprint
  ) VALUES (
    p_user_id,
    p_campaign_id,
    v_cooldown_ends_at,
    v_reward_amount,
    p_ip_address,
    p_device_fingerprint
  );

  -- Log user reward transaction
  INSERT INTO transactions (
    user_id,
    campaign_id,
    transaction_type,
    amount,
    balance_after,
    description
  ) VALUES (
    p_user_id,
    p_campaign_id,
    'reward',
    v_reward_amount,
    v_new_balance,
    'Task completion reward for: ' || v_campaign.title
  );

  -- Log campaign spend transaction
  INSERT INTO transactions (
    user_id,
    campaign_id,
    transaction_type,
    amount,
    balance_after,
    description
  ) VALUES (
    v_campaign.advertiser_id,
    p_campaign_id,
    'campaign_spend',
    -v_campaign.cost_per_action,
    (SELECT wallet_balance FROM profiles WHERE id = v_campaign.advertiser_id),
    'Campaign spend for: ' || v_campaign.title
  );

  -- Log platform commission
  INSERT INTO transactions (
    campaign_id,
    transaction_type,
    amount,
    balance_after,
    description,
    metadata
  ) VALUES (
    p_campaign_id,
    'commission',
    v_platform_commission,
    0,
    'Platform commission for: ' || v_campaign.title,
    json_build_object('user_id', p_user_id, 'advertiser_id', v_campaign.advertiser_id)
  );

  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'cooldown_ends_at', v_cooldown_ends_at,
    'reward_amount', v_reward_amount
  );
END;
$$;
