-- Agregar campos adicionales a rrhh_workers
ALTER TABLE public.rrhh_workers
ADD COLUMN IF NOT EXISTS primer_nombre text,
ADD COLUMN IF NOT EXISTS segundo_nombre text,
ADD COLUMN IF NOT EXISTS apellido_paterno text,
ADD COLUMN IF NOT EXISTS apellido_materno text,
ADD COLUMN IF NOT EXISTS estado_civil text,
ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
ADD COLUMN IF NOT EXISTS direccion text,
ADD COLUMN IF NOT EXISTS ciudad text,
ADD COLUMN IF NOT EXISTS afp text,
ADD COLUMN IF NOT EXISTS salud text,
ADD COLUMN IF NOT EXISTS cargo text,
ADD COLUMN IF NOT EXISTS telefono text,
ADD COLUMN IF NOT EXISTS banco text,
ADD COLUMN IF NOT EXISTS tipo_cuenta text,
ADD COLUMN IF NOT EXISTS numero_cuenta text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS formulario_completado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS datos_admin_completados boolean DEFAULT false;

-- Crear tabla para tokens de registro
CREATE TABLE IF NOT EXISTS public.worker_registration_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Habilitar RLS en la tabla de tokens
ALTER TABLE public.worker_registration_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas para tokens de registro
CREATE POLICY "Master and Admin can view tokens"
ON public.worker_registration_tokens
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('master', 'admin')
  )
);

CREATE POLICY "Master and Admin can create tokens"
ON public.worker_registration_tokens
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('master', 'admin')
  )
);

CREATE POLICY "Master and Admin can update tokens"
ON public.worker_registration_tokens
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('master', 'admin')
  )
);

-- Política para que cualquiera pueda ver tokens válidos (para validación pública)
CREATE POLICY "Anyone can view valid tokens"
ON public.worker_registration_tokens
FOR SELECT
USING (is_active = true AND expires_at > now());

-- Política para que cualquiera pueda insertar trabajadores con token válido
CREATE POLICY "Anyone can insert workers with valid token"
ON public.rrhh_workers
FOR INSERT
WITH CHECK (
  formulario_completado = true
);

-- Crear índice para mejorar búsquedas por token
CREATE INDEX IF NOT EXISTS idx_worker_registration_tokens_token ON public.worker_registration_tokens(token);
CREATE INDEX IF NOT EXISTS idx_worker_registration_tokens_expires_at ON public.worker_registration_tokens(expires_at);