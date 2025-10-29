-- Agregar campo nacionalidad a rrhh_workers
ALTER TABLE public.rrhh_workers
ADD COLUMN IF NOT EXISTS nacionalidad text,
ADD COLUMN IF NOT EXISTS sucursal_admin text,
ADD COLUMN IF NOT EXISTS funciones text,
ADD COLUMN IF NOT EXISTS horario_laboral text,
ADD COLUMN IF NOT EXISTS turnos_rotativos boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS clausulas_especiales text,
ADD COLUMN IF NOT EXISTS contrato_word_path text;

-- Crear tabla para seguimiento de cotizaciones previsionales
CREATE TABLE IF NOT EXISTS public.cotizaciones_previsionales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  periodo_mes integer NOT NULL,
  periodo_anio integer NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente', -- pendiente, pagado_total, pagado_parcial, declarado_no_pagado
  monto_total numeric DEFAULT 0,
  monto_pagado numeric DEFAULT 0,
  fecha_declaracion date,
  fecha_pago date,
  observaciones text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(client_id, periodo_mes, periodo_anio)
);

-- Crear tabla detalle de cotizaciones por trabajador
CREATE TABLE IF NOT EXISTS public.cotizaciones_trabajadores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones_previsionales(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES public.rrhh_workers(id) ON DELETE CASCADE,
  monto numeric NOT NULL DEFAULT 0,
  pagado boolean DEFAULT false,
  fecha_pago date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(cotizacion_id, worker_id)
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.cotizaciones_previsionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones_trabajadores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cotizaciones_previsionales
CREATE POLICY "Master and Admin can view all cotizaciones"
ON public.cotizaciones_previsionales
FOR SELECT
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can insert cotizaciones"
ON public.cotizaciones_previsionales
FOR INSERT
WITH CHECK (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can update cotizaciones"
ON public.cotizaciones_previsionales
FOR UPDATE
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can delete cotizaciones"
ON public.cotizaciones_previsionales
FOR DELETE
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Clients can view own cotizaciones"
ON public.cotizaciones_previsionales
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = cotizaciones_previsionales.client_id
    AND clients.user_id = auth.uid()
  )
);

-- Políticas RLS para cotizaciones_trabajadores
CREATE POLICY "Master and Admin can view all cotizaciones_trabajadores"
ON public.cotizaciones_trabajadores
FOR SELECT
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can insert cotizaciones_trabajadores"
ON public.cotizaciones_trabajadores
FOR INSERT
WITH CHECK (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can update cotizaciones_trabajadores"
ON public.cotizaciones_trabajadores
FOR UPDATE
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can delete cotizaciones_trabajadores"
ON public.cotizaciones_trabajadores
FOR DELETE
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Clients can view own cotizaciones_trabajadores"
ON public.cotizaciones_trabajadores
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM cotizaciones_previsionales cp
    JOIN clients c ON c.id = cp.client_id
    WHERE cp.id = cotizaciones_trabajadores.cotizacion_id
    AND c.user_id = auth.uid()
  )
);

-- Trigger para updated_at en cotizaciones_previsionales
CREATE TRIGGER update_cotizaciones_previsionales_updated_at
BEFORE UPDATE ON public.cotizaciones_previsionales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at en cotizaciones_trabajadores
CREATE TRIGGER update_cotizaciones_trabajadores_updated_at
BEFORE UPDATE ON public.cotizaciones_trabajadores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();