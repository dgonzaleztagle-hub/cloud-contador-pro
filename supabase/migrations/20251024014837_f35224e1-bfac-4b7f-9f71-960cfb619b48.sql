-- Crear tabla para sucursales de trabajo
CREATE TABLE IF NOT EXISTS public.sucursales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;

-- Políticas para sucursales
CREATE POLICY "Master and Admin can view sucursales" 
ON public.sucursales 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY(ARRAY['master'::app_role, 'admin'::app_role])
  )
);

CREATE POLICY "Master and Admin can insert sucursales" 
ON public.sucursales 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY(ARRAY['master'::app_role, 'admin'::app_role])
  )
);

-- Modificar tabla rrhh_workers para agregar nuevos campos
ALTER TABLE public.rrhh_workers
  DROP COLUMN IF EXISTS plazo_contrato,
  DROP COLUMN IF EXISTS atrasos,
  DROP COLUMN IF EXISTS permisos,
  DROP COLUMN IF EXISTS faltas,
  DROP COLUMN IF EXISTS anticipo,
  ADD COLUMN tipo_plazo TEXT NOT NULL DEFAULT 'indefinido' CHECK (tipo_plazo IN ('indefinido', 'fijo')),
  ADD COLUMN fecha_termino DATE,
  ADD COLUMN tipo_jornada TEXT NOT NULL DEFAULT 'completa' CHECK (tipo_jornada IN ('completa', 'parcial_30', 'parcial_20')),
  ADD COLUMN sucursal_id UUID REFERENCES public.sucursales(id),
  ADD COLUMN contrato_pdf_path TEXT,
  ADD COLUMN atrasos_horas INTEGER DEFAULT 0,
  ADD COLUMN atrasos_minutos INTEGER DEFAULT 0,
  ADD COLUMN permisos_horas INTEGER DEFAULT 0,
  ADD COLUMN permisos_minutos INTEGER DEFAULT 0,
  ADD COLUMN permisos_medio_dia INTEGER DEFAULT 0,
  ADD COLUMN permisos_dia_completo INTEGER DEFAULT 0,
  ADD COLUMN faltas_dia_completo INTEGER DEFAULT 0,
  ADD COLUMN faltas_medio_dia INTEGER DEFAULT 0,
  ADD COLUMN anticipo_monto NUMERIC DEFAULT 0;