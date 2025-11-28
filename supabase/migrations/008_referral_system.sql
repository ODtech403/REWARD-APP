-- Referral System Migration
-- Users earn $0.02 for every successful referral

-- Add referral fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_earnings DECIMAL(10,2) DEFAULT 0;

-- Create referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_amount DECIMAL(10,2) NOT NULL DEFAULT 0.02,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_id) -- Each user can only be referred once
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(12)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(12) := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * 36 + 1)::integer, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = result) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Function to process referral when user signs up with referral code
CREATE OR REPLACE FUNCTION process_referral(
  p_new_user_id UUID,
  p_referral_code VARCHAR(12)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_reward_amount DECIMAL(10,2) := 0.02;
  v_referrer_balance DECIMAL(10,2);
BEGIN
  -- Find the referrer by code
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referral_code;
  
  IF v_referrer_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid referral code');
  END IF;
  
  -- Can't refer yourself
  IF v_referrer_id = p_new_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot use your own referral code');
  END IF;
  
  -- Check if user was already referred
  IF EXISTS(SELECT 1 FROM profiles WHERE id = p_new_user_id AND referred_by IS NOT NULL) THEN
    RETURN json_build_object('success', false, 'error', 'User already has a referrer');
  END IF;
  
  -- Update the new user's referred_by field
  UPDATE profiles
  SET referred_by = v_referrer_id
  WHERE id = p_new_user_id;
  
  -- Create referral record
  INSERT INTO referrals (referrer_id, referred_id, reward_amount, status)
  VALUES (v_referrer_id, p_new_user_id, v_reward_amount, 'completed');
  
  -- Update referrer's stats and balance
  UPDATE profiles
  SET 
    referral_count = referral_count + 1,
    referral_earnings = referral_earnings + v_reward_amount,
    wallet_balance = wallet_balance + v_reward_amount
  WHERE id = v_referrer_id
  RETURNING wallet_balance INTO v_referrer_balance;
  
  -- Log the referral reward transaction
  INSERT INTO transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    metadata
  ) VALUES (
    v_referrer_id,
    'reward',
    v_reward_amount,
    v_referrer_balance,
    'Referral bonus',
    json_build_object('referred_user_id', p_new_user_id, 'type', 'referral')
  );
  
  RETURN json_build_object(
    'success', true,
    'referrer_id', v_referrer_id,
    'reward_amount', v_reward_amount
  );
END;
$$;

-- Trigger to auto-generate referral code for new users
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_referral_code ON profiles;
CREATE TRIGGER trigger_auto_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_referral_code();

-- Update existing users to have referral codes
UPDATE profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- RLS Policies for referrals table
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer)
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Users can view if they were referred
CREATE POLICY "Users can view own referred status"
  ON referrals FOR SELECT
  USING (auth.uid() = referred_id);

-- Add comment for documentation
COMMENT ON TABLE referrals IS 'Tracks user referrals and rewards';
COMMENT ON COLUMN profiles.referral_code IS 'Unique code users share to refer others';
COMMENT ON COLUMN profiles.referred_by IS 'ID of user who referred this user';
COMMENT ON COLUMN profiles.referral_count IS 'Number of successful referrals';
COMMENT ON COLUMN profiles.referral_earnings IS 'Total earnings from referrals';
