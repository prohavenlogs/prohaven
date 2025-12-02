-- Fix RLS policies for products to use email-based admin check
-- instead of profiles.role check

-- Drop the incorrect policies
DROP POLICY IF EXISTS "Authenticated users can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- Create new policy for all authenticated users to view active products
CREATE POLICY "Authenticated users can view active products"
ON public.products FOR SELECT
TO authenticated
USING (active = true);

-- Create policy for admin to view all products (including inactive)
CREATE POLICY "Admin can view all products"
ON public.products FOR SELECT
TO authenticated
USING (
  auth.email() = 'prohavenlogs@gmail.com'
);

-- Create policy for admin to insert products
CREATE POLICY "Admin can insert products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (
  auth.email() = 'prohavenlogs@gmail.com'
);

-- Create policy for admin to update products
CREATE POLICY "Admin can update products"
ON public.products FOR UPDATE
TO authenticated
USING (
  auth.email() = 'prohavenlogs@gmail.com'
)
WITH CHECK (
  auth.email() = 'prohavenlogs@gmail.com'
);

-- Create policy for admin to delete products
CREATE POLICY "Admin can delete products"
ON public.products FOR DELETE
TO authenticated
USING (
  auth.email() = 'prohavenlogs@gmail.com'
);
