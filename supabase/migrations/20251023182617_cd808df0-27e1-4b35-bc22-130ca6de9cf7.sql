-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png']
);

-- RLS Policies for documents bucket

-- Allow Master and Admin to upload files
CREATE POLICY "Master and Admin can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = ANY(ARRAY['master'::app_role, 'admin'::app_role])
);

-- Allow Master and Admin to view all documents
CREATE POLICY "Master and Admin can view all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = ANY(ARRAY['master'::app_role, 'admin'::app_role])
);

-- Allow Clients to view their own documents
CREATE POLICY "Clients can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.clients WHERE user_id = auth.uid()
  )
);

-- Allow Master and Admin to delete documents
CREATE POLICY "Master and Admin can delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = ANY(ARRAY['master'::app_role, 'admin'::app_role])
);