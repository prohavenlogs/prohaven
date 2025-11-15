-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for proper role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create wallet_addresses table
CREATE TABLE public.wallet_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on wallet_addresses
ALTER TABLE public.wallet_addresses ENABLE ROW LEVEL SECURITY;

-- Seed default wallet addresses
INSERT INTO public.wallet_addresses (currency, address) VALUES
  ('Bitcoin', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'),
  ('Litecoin', 'ltc1qw508d6qejxtdg4y5r3zarvary0c5xw7kgmn4n9'),
  ('Solana', 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK');

-- Create admin_actions_log table
CREATE TABLE public.admin_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  affected_table TEXT,
  affected_id UUID,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on admin_actions_log
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for wallet_addresses
CREATE POLICY "Everyone can view wallet addresses"
  ON public.wallet_addresses
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update wallet addresses"
  ON public.wallet_addresses
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_actions_log
CREATE POLICY "Admins can insert action logs"
  ON public.admin_actions_log
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all action logs"
  ON public.admin_actions_log
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Update profiles RLS to allow admins to view/update all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update orders RLS to allow admins
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update transactions RLS to allow admins
CREATE POLICY "Admins can view all transactions"
  ON public.transactions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update deposits RLS to allow admins
CREATE POLICY "Admins can view all deposits"
  ON public.deposits
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger to auto-update wallet_addresses.updated_at
CREATE TRIGGER update_wallet_addresses_updated_at
  BEFORE UPDATE ON public.wallet_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();