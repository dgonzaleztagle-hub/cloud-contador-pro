-- Clean up all duplicate and recursive RLS policies

-- Fix worker_events policies
DROP POLICY IF EXISTS "Master and Admin can view all events" ON worker_events;
DROP POLICY IF EXISTS "Master and Admin can insert events" ON worker_events;
DROP POLICY IF EXISTS "Master and Admin can update events" ON worker_events;
DROP POLICY IF EXISTS "Master and Admin can delete events" ON worker_events;

CREATE POLICY "Master and Admin can view all events" ON worker_events
  FOR SELECT USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can insert events" ON worker_events
  FOR INSERT WITH CHECK (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can update events" ON worker_events
  FOR UPDATE USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can delete events" ON worker_events
  FOR DELETE USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Fix sucursales policies
DROP POLICY IF EXISTS "Master and Admin can view sucursales" ON sucursales;
DROP POLICY IF EXISTS "Master and Admin can insert sucursales" ON sucursales;

CREATE POLICY "Master and Admin can view sucursales" ON sucursales
  FOR SELECT USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can insert sucursales" ON sucursales
  FOR INSERT WITH CHECK (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Fix worker_registration_tokens policies
DROP POLICY IF EXISTS "Master and Admin can view tokens" ON worker_registration_tokens;
DROP POLICY IF EXISTS "Master and Admin can create tokens" ON worker_registration_tokens;
DROP POLICY IF EXISTS "Master and Admin can update tokens" ON worker_registration_tokens;

CREATE POLICY "Master and Admin can view tokens" ON worker_registration_tokens
  FOR SELECT USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can create tokens" ON worker_registration_tokens
  FOR INSERT WITH CHECK (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can update tokens" ON worker_registration_tokens
  FOR UPDATE USING (public.has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Remove ALL duplicate rrhh_workers policies and keep only the security definer versions
DROP POLICY IF EXISTS "Master and Admin can view all RRHH" ON rrhh_workers;
DROP POLICY IF EXISTS "Master and Admin can insert RRHH" ON rrhh_workers;
DROP POLICY IF EXISTS "Master and Admin can update RRHH" ON rrhh_workers;
DROP POLICY IF EXISTS "Master and Admin can delete RRHH" ON rrhh_workers;