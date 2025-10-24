-- Eliminar columnas que NO están en el Excel
ALTER TABLE public.clients DROP COLUMN IF EXISTS nombre_fantasia;
ALTER TABLE public.clients DROP COLUMN IF EXISTS comuna;
ALTER TABLE public.clients DROP COLUMN IF EXISTS tipo_contribuyente;
ALTER TABLE public.clients DROP COLUMN IF EXISTS contador_asignado;
ALTER TABLE public.clients DROP COLUMN IF EXISTS rep_legal_telefono;
ALTER TABLE public.clients DROP COLUMN IF EXISTS rep_legal_correo;
ALTER TABLE public.clients DROP COLUMN IF EXISTS certificado_digital_encrypted;
ALTER TABLE public.clients DROP COLUMN IF EXISTS inicio_actividades;

-- Renombrar columnas para que coincidan exactamente con el Excel
ALTER TABLE public.clients RENAME COLUMN correo TO email;
ALTER TABLE public.clients RENAME COLUMN telefono TO fono;
ALTER TABLE public.clients RENAME COLUMN clave_sii_encrypted TO clave_sii;
ALTER TABLE public.clients RENAME COLUMN clave_unica_encrypted TO clave_unica;
ALTER TABLE public.clients RENAME COLUMN rep_legal_nombre TO representante_legal;
ALTER TABLE public.clients RENAME COLUMN rep_legal_rut TO rut_representante;

-- Agregar nuevas columnas que están en el Excel
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS valor TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS clave_certificado TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cod_actividad TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contabilidad TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS fecha_incorporacion DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS clave_sii_repr TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS previred TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS portal_electronico TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS observacion_1 TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS observacion_2 TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS observacion_3 TEXT;