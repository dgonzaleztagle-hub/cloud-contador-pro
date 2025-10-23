-- Drop problematic RLS policies on profiles that cause infinite recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Master can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Master can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Master can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Master can delete profiles" ON public.profiles;

-- Create new policies using security definer functions to prevent recursion
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Master can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role('master'));

CREATE POLICY "Master can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (public.has_role('master'));

CREATE POLICY "Master can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.has_role('master'));

CREATE POLICY "Master can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (public.has_role('master'));