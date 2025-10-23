-- Crear función de seguridad definer para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_any_role(_roles app_role[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = ANY(_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Actualizar políticas RLS para clients usando las funciones
DROP POLICY IF EXISTS "Master and Admin can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view own data" ON public.clients;
DROP POLICY IF EXISTS "Master and Admin can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Master and Admin can update clients" ON public.clients;
DROP POLICY IF EXISTS "Master and Admin can delete clients" ON public.clients;

CREATE POLICY "Master and Admin can view all clients"
  ON public.clients FOR SELECT
  USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Clients can view own data"
  ON public.clients FOR SELECT
  USING (user_id = auth.uid() OR public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can update clients"
  ON public.clients FOR UPDATE
  USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can delete clients"
  ON public.clients FOR DELETE
  USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));