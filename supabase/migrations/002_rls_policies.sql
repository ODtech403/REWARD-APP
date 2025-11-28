-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Profiles are created via trigger"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Categories policies (public read)
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Campaigns policies
CREATE POLICY "Active campaigns are viewable by authenticated users"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    status = 'active' 
    OR advertiser_id = auth.uid()
  );

CREATE POLICY "Advertisers can create campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    advertiser_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('advertiser', 'admin')
    )
  );

CREATE POLICY "Advertisers can update own campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can delete own draft campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (
    advertiser_id = auth.uid() 
    AND status = 'draft'
  );

-- Task completions policies
CREATE POLICY "Users can view own completions"
  ON task_completions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create completions"
  ON task_completions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Deposits policies
CREATE POLICY "Advertisers can view own deposits"
  ON deposits FOR SELECT
  TO authenticated
  USING (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can create deposits"
  ON deposits FOR INSERT
  TO authenticated
  WITH CHECK (
    advertiser_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('advertiser', 'admin')
    )
  );
