-- Fix infinite recursion in RLS policies by creating security definer functions

-- Create function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has any of multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(_roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = ANY(_roles)
  )
$$;

-- Drop and recreate F29 policies using the security definer functions
DROP POLICY IF EXISTS "Master and Admin can view all F29" ON f29_declarations;
DROP POLICY IF EXISTS "Master and Admin can insert F29" ON f29_declarations;
DROP POLICY IF EXISTS "Master and Admin can update F29" ON f29_declarations;
DROP POLICY IF EXISTS "Master and Admin can delete F29" ON f29_declarations;

CREATE POLICY "Master and Admin can view all F29" ON f29_declarations
  FOR SELECT USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can insert F29" ON f29_declarations
  FOR INSERT WITH CHECK (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can update F29" ON f29_declarations
  FOR UPDATE USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can delete F29" ON f29_declarations
  FOR DELETE USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Fix honorarios policies
DROP POLICY IF EXISTS "Master and Admin can view all honorarios" ON honorarios;
DROP POLICY IF EXISTS "Master and Admin can insert honorarios" ON honorarios;
DROP POLICY IF EXISTS "Master and Admin can update honorarios" ON honorarios;
DROP POLICY IF EXISTS "Master and Admin can delete honorarios" ON honorarios;

CREATE POLICY "Master and Admin can view all honorarios" ON honorarios
  FOR SELECT USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can insert honorarios" ON honorarios
  FOR INSERT WITH CHECK (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can update honorarios" ON honorarios
  FOR UPDATE USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can delete honorarios" ON honorarios
  FOR DELETE USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Fix files policies
DROP POLICY IF EXISTS "Master and Admin can view all files" ON files;
DROP POLICY IF EXISTS "Master and Admin can upload files" ON files;
DROP POLICY IF EXISTS "Master and Admin can delete files" ON files;

CREATE POLICY "Master and Admin can view all files" ON files
  FOR SELECT USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can upload files" ON files
  FOR INSERT WITH CHECK (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can delete files" ON files
  FOR DELETE USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Fix RRHH workers policies
DROP POLICY IF EXISTS "Master and Admin can view all workers" ON rrhh_workers;
DROP POLICY IF EXISTS "Master and Admin can insert workers" ON rrhh_workers;
DROP POLICY IF EXISTS "Master and Admin can update workers" ON rrhh_workers;
DROP POLICY IF EXISTS "Master and Admin can delete workers" ON rrhh_workers;

CREATE POLICY "Master and Admin can view all workers" ON rrhh_workers
  FOR SELECT USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can insert workers" ON rrhh_workers
  FOR INSERT WITH CHECK (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can update workers" ON rrhh_workers
  FOR UPDATE USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can delete workers" ON rrhh_workers
  FOR DELETE USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));