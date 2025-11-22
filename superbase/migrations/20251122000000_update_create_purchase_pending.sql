-- Update create_purchase function to accept optional status parameter (defaults to 'pending')
CREATE OR REPLACE FUNCTION public.create_purchase(
  p_user_id uuid,
  p_product_id text,
  p_product_name text,
  p_price numeric,
  p_payment_method text DEFAULT 'balance',
  p_status text DEFAULT 'pending'
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

  -- Create order record with specified status
  INSERT INTO orders (user_id, order_number, product_name, amount, status, payment_method)
  VALUES (p_user_id, v_order_number, p_product_name, p_price, p_status, p_payment_method)
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
