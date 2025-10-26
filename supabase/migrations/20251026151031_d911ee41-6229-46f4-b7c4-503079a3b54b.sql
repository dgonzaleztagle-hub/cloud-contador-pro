-- Refactorización de rrhh_workers: Separar ficha de trabajador de registros mensuales
-- Los registros mensuales (atrasos, faltas, etc.) ya están en worker_events

-- 1. Agregar nuevas columnas necesarias
ALTER TABLE public.rrhh_workers 
ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS fecha_inicio date;

-- 2. Migrar datos existentes antes de eliminar columnas
-- Actualizar fecha_inicio con la fecha más antigua de created_at para cada trabajador
UPDATE public.rrhh_workers 
SET fecha_inicio = COALESCE(fecha_inicio, created_at::date);

-- 3. Eliminar columnas de período (ya que ahora solo es la ficha del trabajador)
ALTER TABLE public.rrhh_workers 
DROP COLUMN IF EXISTS periodo_mes,
DROP COLUMN IF EXISTS periodo_anio;

-- 4. Eliminar campos de eventos que ahora están en worker_events
ALTER TABLE public.rrhh_workers
DROP COLUMN IF EXISTS atrasos_horas,
DROP COLUMN IF EXISTS atrasos_minutos,
DROP COLUMN IF EXISTS permisos_horas,
DROP COLUMN IF EXISTS permisos_minutos,
DROP COLUMN IF EXISTS permisos_medio_dia,
DROP COLUMN IF EXISTS permisos_dia_completo,
DROP COLUMN IF EXISTS faltas_dia_completo,
DROP COLUMN IF EXISTS faltas_medio_dia,
DROP COLUMN IF EXISTS anticipo_monto;

-- 5. Agregar índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_rrhh_workers_client_id ON public.rrhh_workers(client_id);
CREATE INDEX IF NOT EXISTS idx_rrhh_workers_activo ON public.rrhh_workers(activo);
CREATE INDEX IF NOT EXISTS idx_rrhh_workers_fecha_termino ON public.rrhh_workers(fecha_termino) WHERE fecha_termino IS NOT NULL;

-- 6. Crear función para obtener trabajadores con contratos por vencer
-- (Contratos que vencen en los próximos 30 días)
CREATE OR REPLACE FUNCTION public.get_expiring_contracts(days_threshold integer DEFAULT 30)
RETURNS TABLE (
  worker_id uuid,
  worker_name text,
  worker_rut text,
  client_name text,
  fecha_termino date,
  days_remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id as worker_id,
    w.nombre as worker_name,
    w.rut as worker_rut,
    c.razon_social as client_name,
    w.fecha_termino,
    (w.fecha_termino - CURRENT_DATE)::integer as days_remaining
  FROM public.rrhh_workers w
  INNER JOIN public.clients c ON w.client_id = c.id
  WHERE w.activo = true
    AND w.tipo_plazo = 'fijo'
    AND w.fecha_termino IS NOT NULL
    AND w.fecha_termino <= (CURRENT_DATE + days_threshold)
    AND w.fecha_termino >= CURRENT_DATE
  ORDER BY w.fecha_termino ASC;
END;
$$;

-- 7. Crear función para obtener contratos vencidos
CREATE OR REPLACE FUNCTION public.get_expired_contracts()
RETURNS TABLE (
  worker_id uuid,
  worker_name text,
  worker_rut text,
  client_name text,
  fecha_termino date,
  days_expired integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id as worker_id,
    w.nombre as worker_name,
    w.rut as worker_rut,
    c.razon_social as client_name,
    w.fecha_termino,
    (CURRENT_DATE - w.fecha_termino)::integer as days_expired
  FROM public.rrhh_workers w
  INNER JOIN public.clients c ON w.client_id = c.id
  WHERE w.activo = true
    AND w.tipo_plazo = 'fijo'
    AND w.fecha_termino IS NOT NULL
    AND w.fecha_termino < CURRENT_DATE
  ORDER BY w.fecha_termino DESC;
END;
$$;

-- 8. Comentarios para documentación
COMMENT ON COLUMN public.rrhh_workers.activo IS 'Indica si el trabajador está activo en la empresa';
COMMENT ON COLUMN public.rrhh_workers.fecha_inicio IS 'Fecha de inicio del trabajador en la empresa';
COMMENT ON FUNCTION public.get_expiring_contracts IS 'Retorna trabajadores activos con contratos a plazo fijo que vencen pronto';
COMMENT ON FUNCTION public.get_expired_contracts IS 'Retorna trabajadores activos con contratos a plazo fijo ya vencidos';