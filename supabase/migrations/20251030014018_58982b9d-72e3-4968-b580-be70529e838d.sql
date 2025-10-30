-- Agregar política para que Master y Admin puedan subir archivos a las OT
CREATE POLICY "Master and Admin can upload OT files"
ON public.ot_archivos
FOR INSERT
WITH CHECK (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));