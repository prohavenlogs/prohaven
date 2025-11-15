-- Promote user to admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('5035c4c7-182a-4e64-b594-6cd38af84d1e', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;