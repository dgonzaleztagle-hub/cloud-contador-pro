-- Actualizar el primer usuario a rol master (bypass RLS)
UPDATE public.profiles 
SET role = 'master'::app_role 
WHERE email = 'pluscontableltda@gmail.com';