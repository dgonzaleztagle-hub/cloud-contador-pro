-- Actualizar políticas RLS para el rol Cliente (viewer)

-- ============================================
-- TRABAJADORES (rrhh_workers)
-- Los clientes pueden registrar trabajadores y ver sus propios trabajadores
-- ============================================

-- Permitir a clientes insertar trabajadores para sus propias empresas
CREATE POLICY "Clients can insert workers for own company"
ON public.rrhh_workers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = rrhh_workers.client_id
    AND clients.user_id = auth.uid()
  )
);

-- ============================================
-- EVENTOS DE TRABAJADORES (worker_events)
-- Los clientes pueden registrar eventos (faltas, horas extras, etc.)
-- ============================================

-- Esta política ya existe, solo verificamos que esté correcta
-- "Clients can insert events for own workers" ya permite a clientes crear eventos

-- ============================================
-- DOCUMENTOS (files)
-- Los clientes pueden VER pero NO SUBIR documentos
-- ============================================

-- La política de lectura ya existe: "Clients can view own files"
-- NO agregamos política de INSERT para clientes, solo master y admin pueden subir

-- ============================================
-- CONTRATOS
-- Los clientes pueden ver los contratos de sus trabajadores
-- ============================================

-- Los contratos se almacenan en storage.objects
-- Crear política para que clientes puedan descargar contratos de sus trabajadores
CREATE POLICY "Clients can download own workers contracts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (
    SELECT c.id::text
    FROM public.clients c
    WHERE c.user_id = auth.uid()
  )
);

-- ============================================
-- RESUMEN DE PERMISOS PARA ROL CLIENTE (viewer)
-- ============================================
-- ✅ Ver datos propios (clients) - LECTURA
-- ✅ Ver F29 - LECTURA
-- ✅ Ver F22 - LECTURA  
-- ✅ Ver Honorarios - LECTURA
-- ✅ Registrar trabajadores - ESCRITURA
-- ✅ Registrar eventos de trabajadores - ESCRITURA
-- ✅ Ver cotizaciones previsionales - LECTURA
-- ✅ Ver ficha de trabajadores - LECTURA
-- ✅ Ver contratos - LECTURA (storage)
-- ✅ Ver documentos - LECTURA (sin subir)
-- ✅ Crear órdenes de trabajo - ESCRITURA
-- ============================================