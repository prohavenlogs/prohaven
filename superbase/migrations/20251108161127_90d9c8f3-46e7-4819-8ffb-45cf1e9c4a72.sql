-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS telegram_handle TEXT,
ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Banks', 'Cards', 'Accounts', 'Tools')),
  description TEXT,
  balance_label TEXT,
  price_label TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  name_snapshot TEXT NOT NULL,
  price_snapshot NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products are readable by all authenticated users
CREATE POLICY "Authenticated users can view products"
ON public.products FOR SELECT
TO authenticated
USING (active = true);

-- Order items are viewable by the order owner
CREATE POLICY "Users can view their own order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Insert demo products for Banks
INSERT INTO public.products (name, category, description, balance_label, price_label, price) VALUES
('Chase Bank Log', 'Banks', '[Online Access] + [Cookies] + [Account/Routing Number] + [Debit Fullz] + [IP]', '$75,000', '$300', 300),
('Bank of America Premium', 'Banks', 'Full access with 2FA bypass + Account history + Wire transfer capability', '$120,000', '$450', 450),
('Wells Fargo Business', 'Banks', 'Business account with full statement access + Multiple signers', '$95,000', '$380', 380),
('Citibank Gold', 'Banks', 'Premium tier access + Investment account linked', '$150,000', '$550', 550),
('US Bank Platinum', 'Banks', 'Verified account + Mobile app access + Credit line attached', '$85,000', '$340', 340),
('TD Bank Elite', 'Banks', 'High-value account + International transfer enabled', '$110,000', '$420', 420),
('PNC Regional', 'Banks', 'Regional bank access + Multiple account types', '$65,000', '$280', 280),
('Capital One 360', 'Banks', 'Online banking full access + Savings account', '$55,000', '$240', 240),
('Fifth Third Premium', 'Banks', 'Premium checking + Investment portal access', '$90,000', '$360', 360),
('Regions Bank VIP', 'Banks', 'VIP tier access + Wire capabilities + Full history', '$105,000', '$400', 400);

-- Insert demo products for Cards
INSERT INTO public.products (name, category, description, balance_label, price_label, price) VALUES
('Visa Classic', 'Cards', '[Card Number] + [Expiration Date] + [CVV] + [EMV Data] + [Billing Address]', '$2,500', '$55', 55),
('Mastercard Gold', 'Cards', 'Premium card with chip data + 3DS bypass + High limit', '$5,000', '$95', 95),
('Amex Platinum', 'Cards', 'Platinum tier + Full cardholder data + Travel benefits', '$10,000', '$180', 180),
('Visa Signature', 'Cards', 'Signature series + Verified billing + International capable', '$7,500', '$140', 140),
('Mastercard World Elite', 'Cards', 'Elite status + Lounge access data + Concierge info', '$12,000', '$220', 220),
('Discover It', 'Cards', 'Cashback card + Full account access + Rewards balance', '$4,000', '$75', 75),
('Chase Sapphire Reserve', 'Cards', 'Premium travel card + Points system access', '$8,500', '$160', 160),
('Capital One Venture', 'Cards', 'Venture rewards + Miles balance + Travel credits', '$6,000', '$110', 110),
('Citi Double Cash', 'Cards', 'Cashback optimized + 2% on all purchases data', '$3,500', '$65', 65),
('Bank of America Premium', 'Cards', 'Premium rewards + Preferred status + High limit', '$9,000', '$175', 175);

-- Insert demo products for Accounts
INSERT INTO public.products (name, category, description, balance_label, price_label, price) VALUES
('CashApp Verified', 'Accounts', 'Verified account with full access + Transaction history', '$5,000', '$250', 250),
('PayPal Business', 'Accounts', 'Business verified + Merchant account + API access', '$15,000', '$450', 450),
('Venmo Premium', 'Accounts', 'Premium account + Linked bank + Card info', '$3,500', '$180', 180),
('Zelle Corporate', 'Accounts', 'Corporate level access + High transfer limits', '$8,000', '$320', 320),
('Coinbase Pro', 'Accounts', 'Crypto exchange verified + KYC complete + Trading history', '$25,000', '$600', 600),
('Binance Verified', 'Accounts', 'Full KYC + Level 2 verified + Withdrawal enabled', '$30,000', '$700', 700),
('Kraken Advanced', 'Accounts', 'Advanced trading account + Margin enabled', '$20,000', '$550', 550),
('Stripe Connect', 'Accounts', 'Merchant account + Payment processing + API keys', '$10,000', '$400', 400),
('Square Business', 'Accounts', 'Business account + POS access + Transaction data', '$12,000', '$380', 380),
('Chime Banking', 'Accounts', 'Digital banking + Direct deposit info + Spending history', '$4,500', '$200', 200);

-- Insert demo products for Tools
INSERT INTO public.products (name, category, description, balance_label, price_label, price) VALUES
('Email Checker Pro', 'Tools', 'Advanced email validation + Breach check + Domain analysis', 'N/A', '$150', 150),
('Account Recovery Kit', 'Tools', 'Multi-platform recovery tools + 2FA bypass methods', 'N/A', '$280', 280),
('Identity Validator', 'Tools', 'SSN verification + Address validation + Credit check', 'N/A', '$220', 220),
('Card Validator Suite', 'Tools', 'BIN lookup + CVV generator + Luhn checker', 'N/A', '$180', 180),
('Proxy Manager Pro', 'Tools', 'Residential proxies + Rotating IPs + 50+ locations', 'N/A', '$120', 120),
('SMS Receiver', 'Tools', 'Virtual numbers + SMS bypass + Multiple carriers', 'N/A', '$95', 95),
('Browser Fingerprint Kit', 'Tools', 'Anti-detect browser + Profile manager + Canvas spoofing', 'N/A', '$250', 250),
('Document Generator', 'Tools', 'ID creation + Utility bill generator + Bank statement maker', 'N/A', '$320', 320),
('OSINT Toolkit', 'Tools', 'People search + Social media finder + Data aggregation', 'N/A', '$200', 200),
('Automation Bot Suite', 'Tools', 'Account creator + Form filler + CAPTCHA solver', 'N/A', '$380', 380);

-- Create function to update wallet balance safely
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_amount NUMERIC,
  p_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_type = 'deposit' THEN
    UPDATE public.profiles
    SET wallet_balance = wallet_balance + p_amount
    WHERE id = p_user_id;
  ELSIF p_type = 'spend' THEN
    UPDATE public.profiles
    SET wallet_balance = wallet_balance - p_amount
    WHERE id = p_user_id
    AND wallet_balance >= p_amount;
  END IF;
END;
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'admin'
  );
$$;