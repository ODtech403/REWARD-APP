-- Fix function search path security warnings
-- This prevents potential security issues with mutable search paths

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix complete_task function with proper search_path
CREATE OR REPLACE FUNCTION public.complete_task(
  p_user_id UUID,
  p_campaign_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign RECORD;
  v_user_balance DECIMAL(10,4);
  v_reward_amount DECIMAL(10,4);
  v_cooldown_ends_at TIMESTAMPTZ;
  v_existing_cooldown TIMESTAMPTZ;
  v_new_balance DECIMAL(10,4);
  v_platform_commission DECIMAL(10,4);
BEGIN
  -- Lock the campaign row to prevent race conditions
  SELECT * INTO v_campaign
  FROM campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;

  IF v_campaign IS NULL THEN
    RETURN json_build_object('success', false, 'error_message', 'Campaign not found');
  END IF;

  IF v_campaign.status != 'active' THEN
    RETURN json_build_object('success', false, 'error_message', 'Campaign is not active');
  END IF;

  IF (v_campaign.total_budget - v_campaign.spent_amount) < v_campaign.cost_per_action THEN
    UPDATE campaigns SET status = 'depleted' WHERE id = p_campaign_id;
    RETURN json_build_object('success', false, 'error_message', 'Campaign budget depleted');
  END IF;

  SELECT cooldown_ends_at INTO v_existing_cooldown
  FROM task_completions
  WHERE user_id = p_user_id AND campaign_id = p_campaign_id AND cooldown_ends_at > NOW()
  ORDER BY cooldown_ends_at DESC LIMIT 1;

  IF v_existing_cooldown IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error_message', 'Task is on cooldown', 'cooldown_ends_at', v_existing_cooldown);
  END IF;

  v_reward_amount := v_campaign.cost_per_action * 0.75;
  v_platform_commission := v_campaign.cost_per_action * 0.25;
  v_cooldown_ends_at := NOW() + (v_campaign.cooldown_seconds || ' seconds')::INTERVAL;

  SELECT wallet_balance INTO v_user_balance FROM profiles WHERE id = p_user_id FOR UPDATE;
  v_new_balance := v_user_balance + v_reward_amount;

  UPDATE campaigns SET 
    spent_amount = spent_amount + v_campaign.cost_per_action,
    completed_count = completed_count + 1,
    status = CASE WHEN (total_budget - spent_amount - v_campaign.cost_per_action) < v_campaign.cost_per_action THEN 'depleted' ELSE status END
  WHERE id = p_campaign_id;

  UPDATE profiles SET wallet_balance = v_new_balance WHERE id = p_user_id;

  INSERT INTO task_completions (user_id, campaign_id, cooldown_ends_at, reward_amount, ip_address, device_fingerprint)
  VALUES (p_user_id, p_campaign_id, v_cooldown_ends_at, v_reward_amount, p_ip_address, p_device_fingerprint);

  INSERT INTO transactions (user_id, campaign_id, transaction_type, amount, balance_after, description)
  VALUES (p_user_id, p_campaign_id, 'reward', v_reward_amount, v_new_balance, 'Task completion reward for: ' || v_campaign.title);

  INSERT INTO transactions (user_id, campaign_id, transaction_type, amount, balance_after, description)
  VALUES (v_campaign.advertiser_id, p_campaign_id, 'campaign_spend', -v_campaign.cost_per_action, 
    (SELECT wallet_balance FROM profiles WHERE id = v_campaign.advertiser_id), 'Campaign spend for: ' || v_campaign.title);

  INSERT INTO transactions (campaign_id, transaction_type, amount, balance_after, description, metadata)
  VALUES (p_campaign_id, 'commission', v_platform_commission, 0, 'Platform commission for: ' || v_campaign.title,
    json_build_object('user_id', p_user_id, 'advertiser_id', v_campaign.advertiser_id));

  RETURN json_build_object('success', true, 'new_balance', v_new_balance, 'cooldown_ends_at', v_cooldown_ends_at, 'reward_amount', v_reward_amount);
END;
$$;

-- Fix immutable_date function (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'immutable_date') THEN
    EXECUTE 'ALTER FUNCTION public.immutable_date SET search_path = public';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Fix update_user_balance function (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_user_balance') THEN
    EXECUTE 'ALTER FUNCTION public.update_user_balance SET search_path = public';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Fix set_cooldown_expiration function (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_cooldown_expiration') THEN
    EXECUTE 'ALTER FUNCTION public.set_cooldown_expiration SET search_path = public';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Fix update_campaign_budget function (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_campaign_budget') THEN
    EXECUTE 'ALTER FUNCTION public.update_campaign_budget SET search_path = public';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Add index for faster profile role lookups in middleware
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON public.profiles(id, role);

-- Add index for faster task completions lookup
CREATE INDEX IF NOT EXISTS idx_task_completions_user_cooldown ON public.task_completions(user_id, cooldown_ends_at DESC);

-- Add index for faster active campaigns lookup
CREATE INDEX IF NOT EXISTS idx_campaigns_status_budget ON public.campaigns(status, total_budget DESC) WHERE status = 'active';
