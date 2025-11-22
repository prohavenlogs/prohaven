-- Add missing columns to transactions table
-- These columns are referenced in the code but may be missing from the database

-- Add reference_id column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transactions'
    AND column_name = 'reference_id'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN reference_id text;
  END IF;
END $$;

-- Add tx_hash column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transactions'
    AND column_name = 'tx_hash'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN tx_hash text;
  END IF;
END $$;

-- Add payment_id column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transactions'
    AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN payment_id text;
  END IF;
END $$;

-- Add proof_url column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transactions'
    AND column_name = 'proof_url'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN proof_url text;
  END IF;
END $$;

-- Add sender_info column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transactions'
    AND column_name = 'sender_info'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN sender_info text;
  END IF;
END $$;

-- Add wallet_address column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transactions'
    AND column_name = 'wallet_address'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN wallet_address text;
  END IF;
END $$;

-- Add updated_at column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'transactions'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create index on reference_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON public.transactions(reference_id);
