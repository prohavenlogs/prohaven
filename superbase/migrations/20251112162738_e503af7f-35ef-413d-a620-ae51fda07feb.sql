-- Create atomic purchase function with proper balance locking
CREATE OR REPLACE FUNCTION public.create_purchase(
  p_user_id uuid,
  p_product_id text,
  p_product_name text,
  p_price numeric,
  p_payment_method text DEFAULT 'wallet'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_order_id uuid;
  v_order_number text;
BEGIN
  -- Lock the user's profile row and get current balance
  SELECT wallet_balance INTO v_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user has sufficient balance
  IF v_balance < p_price THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS';
  END IF;

  -- Deduct from wallet balance
  UPDATE profiles
  SET wallet_balance = wallet_balance - p_price
  WHERE id = p_user_id;

  -- Generate order number
  v_order_number := 'ORD-' || EXTRACT(EPOCH FROM now())::bigint::text;

  -- Create order record
  INSERT INTO orders (user_id, order_number, product_name, amount, status, payment_method)
  VALUES (p_user_id, v_order_number, p_product_name, p_price, 'completed', p_payment_method)
  RETURNING id INTO v_order_id;

  -- Create transaction record
  INSERT INTO transactions (user_id, type, amount, crypto_currency, status)
  VALUES (p_user_id, 'spend', p_price, 'USD', 'completed');

  -- Return order details
  RETURN json_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'success', true
  );
END;
$$;

-- Create admin transaction status update function with balance management
CREATE OR REPLACE FUNCTION public.admin_set_transaction_status(
  p_tx_id uuid,
  p_new_status text,
  p_admin_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx_record RECORD;
  v_old_status text;
  v_amount numeric;
  v_user_id uuid;
  v_tx_type text;
BEGIN
  -- Verify admin permission
  IF NOT has_role(p_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED';
  END IF;

  -- Lock and get transaction record
  SELECT id, user_id, type, amount, status INTO v_tx_record
  FROM transactions
  WHERE id = p_tx_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND';
  END IF;

  v_old_status := v_tx_record.status;
  v_amount := v_tx_record.amount;
  v_user_id := v_tx_record.user_id;
  v_tx_type := v_tx_record.type;

  -- Only process balance changes for deposit transactions
  IF v_tx_type = 'deposit' THEN
    -- Completing a pending/failed deposit -> credit balance
    IF v_old_status != 'completed' AND p_new_status = 'completed' THEN
      UPDATE profiles
      SET wallet_balance = wallet_balance + v_amount
      WHERE id = v_user_id;
    
    -- Reverting a completed deposit to pending/failed -> debit balance
    ELSIF v_old_status = 'completed' AND p_new_status IN ('pending', 'failed') THEN
      -- Check if user has sufficient balance to reverse
      UPDATE profiles
      SET wallet_balance = wallet_balance - v_amount
      WHERE id = v_user_id
      AND wallet_balance >= v_amount;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'INSUFFICIENT_BALANCE_TO_REVERSE';
      END IF;
    END IF;
  END IF;

  -- Update transaction status
  UPDATE transactions
  SET status = p_new_status
  WHERE id = p_tx_id;

  -- Log admin action
  INSERT INTO admin_actions_log (admin_id, action_type, affected_table, affected_id, note)
  VALUES (
    p_admin_id,
    'update_transaction_status',
    'transactions',
    p_tx_id,
    format('Changed status from %s to %s', v_old_status, p_new_status)
  );

  RETURN json_build_object(
    'success', true,
    'old_status', v_old_status,
    'new_status', p_new_status
  );
END;
$$;