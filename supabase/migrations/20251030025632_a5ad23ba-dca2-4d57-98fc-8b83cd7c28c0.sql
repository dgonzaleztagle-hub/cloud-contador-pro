-- Mejorar la política de inserción de OT para clientes
-- Permitir que usuarios autenticados creen OT para clientes donde su user_id coincida

DROP POLICY IF EXISTS "Clients can create own OT" ON public.ordenes_trabajo;

CREATE POLICY "Clients can create own OT" 
ON public.ordenes_trabajo
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = ordenes_trabajo.client_id
    AND c.user_id = auth.uid()
  )
);