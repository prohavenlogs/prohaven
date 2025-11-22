-- Add fiat deposit support to transactions table
-- This migration adds fields needed for Cash App, Zelle, Venmo, PayPal deposits

-- Add payment_method column to track fiat vs crypto payments
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add reference_id for fiat payment reference (e.g., Cash App $cashtag, Zelle confirmation)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS reference_id TEXT;

-- Add proof_url for payment proof screenshots
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- Add sender_info for fiat payment sender details (name, email, phone)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS sender_info TEXT;

-- Create index for payment_method lookups
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method
  ON public.transactions(payment_method);

-- Create table to store admin-configured payment info (Cash App tag, Zelle email, etc.)
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method TEXT NOT NULL UNIQUE,
  account_info TEXT NOT NULL, -- The $cashtag, email, phone, etc.
  display_name TEXT, -- Human-readable name to display
  instructions TEXT, -- Custom instructions for users
  is_active BOOLEAN DEFAULT true,
  min_amount NUMERIC DEFAULT 10,
  max_amount NUMERIC DEFAULT 5000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payment_settings
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read payment settings (needed for deposit modal)
CREATE POLICY "Anyone can view active payment settings"
  ON public.payment_settings FOR SELECT
  USING (is_active = true);

-- Only admins can modify payment settings
CREATE POLICY "Admins can manage payment settings"
  ON public.payment_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Insert default payment methods (admin can update these)
INSERT INTO public.payment_settings (payment_method, account_info, display_name, instructions, is_active)
VALUES
  ('cashapp', '$ProHaven', 'Cash App', 'Send payment to our Cash App and include your email in the note.', true),
  ('zelle', 'payments@prohaven.com', 'Zelle', 'Send payment via Zelle to our email address.', true),
  ('venmo', '@ProHaven', 'Venmo', 'Send payment to our Venmo account.', true),
  ('paypal', 'payments@prohaven.com', 'PayPal', 'Send payment via PayPal Friends & Family to avoid fees.', true)
ON CONFLICT (payment_method) DO NOTHING;

-- Add trigger for updated_at on payment_settings
DROP TRIGGER IF EXISTS update_payment_settings_updated_at ON public.payment_settings;
CREATE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for payment_settings
ALTER TABLE public.payment_settings REPLICA IDENTITY FULL;

-- Add to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'payment_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_settings;
  END IF;
END $$;

-- Create function to submit a fiat deposit request
CREATE OR REPLACE FUNCTION public.submit_fiat_deposit(
  p_user_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_proof_url TEXT DEFAULT NULL,
  p_sender_info TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_min_amount NUMERIC;
  v_max_amount NUMERIC;
  v_is_active BOOLEAN;
BEGIN
  -- Validate payment method exists and is active
  SELECT is_active, min_amount, max_amount
  INTO v_is_active, v_min_amount, v_max_amount
  FROM payment_settings
  WHERE payment_method = p_payment_method;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_METHOD';
  END IF;

  IF NOT v_is_active THEN
    RAISE EXCEPTION 'PAYMENT_METHOD_DISABLED';
  END IF;

  -- Validate amount
  IF p_amount < v_min_amount THEN
    RAISE EXCEPTION 'AMOUNT_BELOW_MINIMUM';
  END IF;

  IF p_amount > v_max_amount THEN
    RAISE EXCEPTION 'AMOUNT_ABOVE_MAXIMUM';
  END IF;

  -- Create the deposit transaction (pending status)
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    crypto_currency,
    payment_method,
    reference_id,
    proof_url,
    sender_info,
    status
  )
  VALUES (
    p_user_id,
    'deposit',
    p_amount,
    'USD', -- Fiat deposits are in USD
    p_payment_method,
    p_reference_id,
    p_proof_url,
    p_sender_info,
    'pending'
  )
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'status', 'pending',
    'success', true
  );
END;
$$;

-- Update the admin_set_transaction_status function to handle the new fields
-- (The existing function should work, but let's make sure it logs payment_method)
CREATE OR REPLACE FUNCTION public.admin_set_transaction_status(
  p_admin_id UUID,
  p_tx_id UUID,
  p_new_status TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status TEXT;
  v_tx_type TEXT;
  v_tx_amount NUMERIC;
  v_tx_user_id UUID;
  v_payment_method TEXT;
BEGIN
  -- Check if admin
  IF NOT is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED';
  END IF;

  -- Get current transaction details
  SELECT status, type, amount, user_id, payment_method
  INTO v_old_status, v_tx_type, v_tx_amount, v_tx_user_id, v_payment_method
  FROM transactions
  WHERE id = p_tx_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND';
  END IF;

  -- If status hasn't changed, do nothing
  IF v_old_status = p_new_status THEN
    RETURN json_build_object(
      'success', true,
      'old_status', v_old_status,
      'new_status', p_new_status,
      'message', 'Status unchanged'
    );
  END IF;

  -- Handle balance changes based on status transitions
  -- For deposits: pending->completed = add balance, completed->pending/failed = remove balance
  IF v_tx_type = 'deposit' THEN
    -- Approving a pending deposit
    IF v_old_status = 'pending' AND p_new_status = 'completed' THEN
      UPDATE profiles
      SET wallet_balance = COALESCE(wallet_balance, 0) + v_tx_amount
      WHERE id = v_tx_user_id;
    -- Reversing a completed deposit
    ELSIF v_old_status = 'completed' AND (p_new_status = 'pending' OR p_new_status = 'failed') THEN
      -- Check if user has enough balance
      IF (SELECT COALESCE(wallet_balance, 0) FROM profiles WHERE id = v_tx_user_id) < v_tx_amount THEN
        RAISE EXCEPTION 'INSUFFICIENT_BALANCE_TO_REVERSE';
      END IF;
      UPDATE profiles
      SET wallet_balance = wallet_balance - v_tx_amount
      WHERE id = v_tx_user_id;
    END IF;
  END IF;

  -- Update the transaction status
  UPDATE transactions
  SET status = p_new_status, updated_at = NOW()
  WHERE id = p_tx_id;

  -- Log the admin action
  INSERT INTO admin_actions_log (admin_id, action_type, affected_table, affected_id, note)
  VALUES (
    p_admin_id,
    'update_transaction_status',
    'transactions',
    p_tx_id,
    'Changed status from ' || v_old_status || ' to ' || p_new_status ||
    CASE WHEN v_payment_method IS NOT NULL THEN ' (Payment method: ' || v_payment_method || ')' ELSE '' END
  );

  RETURN json_build_object(
    'success', true,
    'old_status', v_old_status,
    'new_status', p_new_status
  );
END;
$$;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION public.submit_fiat_deposit TO authenticated;
