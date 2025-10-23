-- Limpiar todas las políticas de clients y crear nuevas más simples
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Master and Admin can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Master and Admin can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Master and Admin can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Master and Admin can update clients" ON public.clients;

-- Política simple: todos los autenticados pueden ver
CREATE POLICY "Anyone authenticated can view clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

-- Política simple: solo master/admin pueden modificar
CREATE POLICY "Master and Admin can modify clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]))
  WITH CHECK (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));