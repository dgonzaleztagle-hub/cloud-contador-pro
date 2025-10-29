-- Permitir a los clientes subir archivos a sus propias órdenes de trabajo
CREATE POLICY "Clients can upload files to own OT"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'ot'
  AND EXISTS (
    SELECT 1 FROM ordenes_trabajo ot
    JOIN clients c ON c.id = ot.client_id
    WHERE c.user_id = auth.uid()
    AND ot.id::text = (storage.foldername(name))[2]
  )
);

-- Permitir a los clientes descargar archivos de sus propias órdenes de trabajo
CREATE POLICY "Clients can download own OT files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'ot'
  AND (
    -- Master y Admin pueden ver todo
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('master', 'admin')
    )
    OR
    -- Clientes solo sus OT
    EXISTS (
      SELECT 1 FROM ordenes_trabajo ot
      JOIN clients c ON c.id = ot.client_id
      WHERE c.user_id = auth.uid()
      AND ot.id::text = (storage.foldername(name))[2]
    )
  )
);