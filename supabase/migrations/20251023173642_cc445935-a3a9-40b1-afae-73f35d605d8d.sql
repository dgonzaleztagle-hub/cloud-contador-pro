-- Simplificar políticas RLS - permitir acceso a usuarios autenticados
DROP POLICY IF EXISTS "Master and Admin can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view own data" ON public.clients;

-- Nueva política simplificada: todos los usuarios autenticados pueden ver clientes
CREATE POLICY "Authenticated users can view clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

-- Solo master y admin pueden insertar/actualizar/eliminar
CREATE POLICY "Master and Admin can manage clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]))
  WITH CHECK (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));