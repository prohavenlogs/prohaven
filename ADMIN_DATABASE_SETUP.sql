-- ============================================
-- ADMIN WALLET ADDRESSES DATABASE SETUP
-- ============================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Create wallet_addresses table
CREATE TABLE IF NOT EXISTS wallet_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create admin_actions_log table (for tracking admin changes)
CREATE TABLE IF NOT EXISTS admin_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  affected_table TEXT,
  affected_id TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE wallet_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for wallet_addresses
-- Allow everyone to read wallet addresses (for deposits)
CREATE POLICY "Allow public read access to wallet addresses"
ON wallet_addresses FOR SELECT
USING (true);

-- Only admin can insert/update/delete
CREATE POLICY "Allow admin to insert wallet addresses"
ON wallet_addresses FOR INSERT
WITH CHECK (
  auth.email() = 'prohavenlogs@gmail.com'
);

CREATE POLICY "Allow admin to update wallet addresses"
ON wallet_addresses FOR UPDATE
USING (
  auth.email() = 'prohavenlogs@gmail.com'
);

CREATE POLICY "Allow admin to delete wallet addresses"
ON wallet_addresses FOR DELETE
USING (
  auth.email() = 'prohavenlogs@gmail.com'
);

-- 5. Create policies for admin_actions_log
-- Only admin can read and insert logs
CREATE POLICY "Allow admin to read action logs"
ON admin_actions_log FOR SELECT
USING (
  auth.email() = 'prohavenlogs@gmail.com'
);

CREATE POLICY "Allow admin to insert action logs"
ON admin_actions_log FOR INSERT
WITH CHECK (
  auth.email() = 'prohavenlogs@gmail.com'
);

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_wallet_addresses_updated_at ON wallet_addresses;
CREATE TRIGGER update_wallet_addresses_updated_at
  BEFORE UPDATE ON wallet_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert default wallet addresses (REPLACE WITH YOUR ACTUAL ADDRESSES!)
INSERT INTO wallet_addresses (currency, address) VALUES
  ('Bitcoin', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'),
  ('Ethereum', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'),
  ('Litecoin', 'LQTpSFnDFPsSg6FaEwqiD8Ld3vNJVzKjZD'),
  ('Solana', '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV')
ON CONFLICT (currency) DO NOTHING;

-- 9. Grant permissions
GRANT ALL ON wallet_addresses TO authenticated;
GRANT ALL ON admin_actions_log TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify everything is set up correctly:

-- Check wallet addresses
SELECT * FROM wallet_addresses;

-- Check admin action logs
SELECT * FROM admin_actions_log;

-- Check policies
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('wallet_addresses', 'admin_actions_log');
