-- Create user_wallets table for multi-wallet support
-- This allows users to link multiple wallets to one email/account
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN DEFAULT false,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_wallet_address ON public.user_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_wallets_is_primary ON public.user_wallets(user_id, is_primary) WHERE is_primary = true;

-- Enable RLS on user_wallets
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can insert their own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can update their own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can delete their own wallets" ON public.user_wallets;

-- RLS Policies for user_wallets
CREATE POLICY "Users can view their own wallets"
  ON public.user_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets"
  ON public.user_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets"
  ON public.user_wallets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets"
  ON public.user_wallets FOR DELETE
  USING (auth.uid() = user_id AND is_primary = false);

-- Ensure only one primary wallet per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_wallet_per_user
  ON public.user_wallets(user_id)
  WHERE is_primary = true;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_user_wallets_updated_at ON public.user_wallets;
CREATE TRIGGER update_user_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to set a wallet as primary (unsets others)
CREATE OR REPLACE FUNCTION public.set_primary_wallet(p_wallet_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify wallet belongs to user
  IF NOT EXISTS (SELECT 1 FROM user_wallets WHERE id = p_wallet_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;

  -- Unset all other primary wallets for this user
  UPDATE user_wallets
  SET is_primary = false
  WHERE user_id = p_user_id AND id != p_wallet_id;

  -- Set the selected wallet as primary
  UPDATE user_wallets
  SET is_primary = true
  WHERE id = p_wallet_id;
END;
$$;

-- Function to link a new wallet to existing user
CREATE OR REPLACE FUNCTION public.link_wallet(
  p_user_id UUID,
  p_wallet_address TEXT,
  p_nickname TEXT DEFAULT NULL,
  p_is_primary BOOLEAN DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
  v_existing_user UUID;
BEGIN
  -- Normalize wallet address
  p_wallet_address := LOWER(p_wallet_address);

  -- Check if wallet is already linked to ANY user
  SELECT user_id INTO v_existing_user
  FROM user_wallets
  WHERE wallet_address = p_wallet_address;

  IF v_existing_user IS NOT NULL THEN
    IF v_existing_user = p_user_id THEN
      RAISE EXCEPTION 'WALLET_ALREADY_LINKED_TO_YOU';
    ELSE
      RAISE EXCEPTION 'WALLET_ALREADY_LINKED_TO_ANOTHER_USER';
    END IF;
  END IF;

  -- If this is being set as primary, unset other primary wallets first
  IF p_is_primary THEN
    UPDATE user_wallets
    SET is_primary = false
    WHERE user_id = p_user_id;
  END IF;

  -- Insert the new wallet
  INSERT INTO user_wallets (user_id, wallet_address, is_primary, nickname)
  VALUES (p_user_id, p_wallet_address, p_is_primary, p_nickname)
  RETURNING id INTO v_wallet_id;

  RETURN json_build_object(
    'wallet_id', v_wallet_id,
    'success', true
  );
END;
$$;

-- Function to find user by any linked wallet address
CREATE OR REPLACE FUNCTION public.get_user_by_wallet(p_wallet_address TEXT)
RETURNS TABLE(user_id UUID, email TEXT, is_primary BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    uw.user_id,
    p.email,
    uw.is_primary
  FROM user_wallets uw
  JOIN profiles p ON p.id = uw.user_id
  WHERE uw.wallet_address = LOWER(p_wallet_address);
END;
$$;

-- Add wallet_address column to transactions for tracking which wallet was used
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Add wallet_address column to orders for tracking which wallet was used
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Create index for transaction wallet lookups
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_address
  ON public.transactions(wallet_address);

CREATE INDEX IF NOT EXISTS idx_orders_wallet_address
  ON public.orders(wallet_address);

-- Migrate existing user wallets from auth metadata to user_wallets table
-- This is for users who already have wallet_address in their metadata
DO $$
DECLARE
  user_record RECORD;
  wallet_addr TEXT;
BEGIN
  FOR user_record IN
    SELECT id, raw_user_meta_data
    FROM auth.users
    WHERE raw_user_meta_data->>'wallet_address' IS NOT NULL
  LOOP
    wallet_addr := LOWER(user_record.raw_user_meta_data->>'wallet_address');

    -- Insert wallet if it doesn't exist
    INSERT INTO public.user_wallets (user_id, wallet_address, is_primary, nickname)
    VALUES (user_record.id, wallet_addr, true, 'Primary Wallet')
    ON CONFLICT (wallet_address) DO NOTHING;
  END LOOP;
END $$;

-- Enable realtime for user_wallets
ALTER TABLE public.user_wallets REPLICA IDENTITY FULL;

-- Add to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'user_wallets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_wallets;
  END IF;
END $$;

-- Link profiles table to user_wallets table
-- Add wallet_address column to profiles for quick access to primary wallet (denormalized for performance)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Create index on profiles.wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address
  ON public.profiles(wallet_address);

-- Create trigger function to auto-sync primary wallet address to profiles
CREATE OR REPLACE FUNCTION public.sync_primary_wallet_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If a wallet is being set as primary, update the profile
  IF NEW.is_primary = true THEN
    UPDATE profiles
    SET wallet_address = NEW.wallet_address
    WHERE id = NEW.user_id;
  END IF;

  -- If a primary wallet is being deleted or set to non-primary, clear the profile
  IF (TG_OP = 'DELETE' AND OLD.is_primary = true) OR
     (TG_OP = 'UPDATE' AND OLD.is_primary = true AND NEW.is_primary = false) THEN
    -- Find if there's another primary wallet
    UPDATE profiles
    SET wallet_address = (
      SELECT wallet_address
      FROM user_wallets
      WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND is_primary = true
      LIMIT 1
    )
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to sync primary wallet to profiles on INSERT/UPDATE/DELETE
DROP TRIGGER IF EXISTS sync_primary_wallet_on_insert_update ON public.user_wallets;
CREATE TRIGGER sync_primary_wallet_on_insert_update
  AFTER INSERT OR UPDATE ON public.user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_primary_wallet_to_profile();

DROP TRIGGER IF EXISTS sync_primary_wallet_on_delete ON public.user_wallets;
CREATE TRIGGER sync_primary_wallet_on_delete
  AFTER DELETE ON public.user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_primary_wallet_to_profile();

-- Sync existing primary wallets to profiles table
UPDATE profiles p
SET wallet_address = uw.wallet_address
FROM user_wallets uw
WHERE p.id = uw.user_id
AND uw.is_primary = true;

-- Create view for easy access to user profile with primary wallet info
CREATE OR REPLACE VIEW public.user_profiles_with_primary_wallet AS
SELECT
  p.*,
  uw.id as primary_wallet_id,
  uw.wallet_address as primary_wallet_address,
  uw.nickname as primary_wallet_nickname,
  uw.created_at as primary_wallet_created_at
FROM profiles p
LEFT JOIN user_wallets uw ON p.id = uw.user_id AND uw.is_primary = true;

-- Grant access to the view
GRANT SELECT ON public.user_profiles_with_primary_wallet TO authenticated;

-- Enable RLS on the view (inherits from profiles table)
ALTER VIEW public.user_profiles_with_primary_wallet SET (security_invoker = true);
