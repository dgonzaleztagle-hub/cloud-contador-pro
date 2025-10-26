-- Crear tabla de honorarios mensuales
CREATE TABLE IF NOT EXISTS public.honorarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  periodo_mes integer NOT NULL CHECK (periodo_mes >= 1 AND periodo_mes <= 12),
  periodo_anio integer NOT NULL CHECK (periodo_anio >= 2020),
  monto numeric NOT NULL DEFAULT 0,
  saldo_pendiente_anterior numeric NOT NULL DEFAULT 0,
  total_con_saldo numeric GENERATED ALWAYS AS (monto + saldo_pendiente_anterior) STORED,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'parcial')),
  monto_pagado numeric NOT NULL DEFAULT 0,
  saldo_actual numeric GENERATED ALWAYS AS (monto + saldo_pendiente_anterior - monto_pagado) STORED,
  fecha_pago date,
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  -- Constraint único: un registro de honorario por cliente por período
  UNIQUE(client_id, periodo_mes, periodo_anio)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_honorarios_client_id ON public.honorarios(client_id);
CREATE INDEX IF NOT EXISTS idx_honorarios_periodo ON public.honorarios(periodo_mes, periodo_anio);
CREATE INDEX IF NOT EXISTS idx_honorarios_estado ON public.honorarios(estado);

-- Enable RLS
ALTER TABLE public.honorarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Master and Admin can view all honorarios"
  ON public.honorarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master', 'admin')
    )
  );

CREATE POLICY "Clients can view own honorarios"
  ON public.honorarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = honorarios.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Master and Admin can insert honorarios"
  ON public.honorarios FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master', 'admin')
    )
  );

CREATE POLICY "Master and Admin can update honorarios"
  ON public.honorarios FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master', 'admin')
    )
  );

CREATE POLICY "Master and Admin can delete honorarios"
  ON public.honorarios FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master', 'admin')
    )
  );

-- Trigger para actualizar updated_at
CREATE TRIGGER update_honorarios_updated_at
  BEFORE UPDATE ON public.honorarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para sincronizar estado de honorarios con F29
CREATE OR REPLACE FUNCTION public.sync_honorarios_to_f29()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar estado en F29 cuando cambia en honorarios
  UPDATE public.f29_declarations
  SET estado_honorarios = NEW.estado
  WHERE client_id = NEW.client_id
    AND periodo_mes = NEW.periodo_mes
    AND periodo_anio = NEW.periodo_anio;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para sincronizar honorarios -> F29
CREATE TRIGGER sync_honorarios_to_f29_trigger
  AFTER INSERT OR UPDATE OF estado ON public.honorarios
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_honorarios_to_f29();

-- Función para sincronizar F29 a honorarios
CREATE OR REPLACE FUNCTION public.sync_f29_to_honorarios()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear o actualizar honorario cuando se crea/actualiza F29
  INSERT INTO public.honorarios (
    client_id,
    periodo_mes,
    periodo_anio,
    monto,
    estado,
    created_by
  )
  VALUES (
    NEW.client_id,
    NEW.periodo_mes,
    NEW.periodo_anio,
    NEW.honorarios,
    NEW.estado_honorarios,
    NEW.created_by
  )
  ON CONFLICT (client_id, periodo_mes, periodo_anio)
  DO UPDATE SET
    monto = EXCLUDED.monto,
    estado = EXCLUDED.estado,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para sincronizar F29 -> honorarios
CREATE TRIGGER sync_f29_to_honorarios_trigger
  AFTER INSERT OR UPDATE OF honorarios, estado_honorarios ON public.f29_declarations
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_f29_to_honorarios();

-- Función para obtener resumen de honorarios del mes
CREATE OR REPLACE FUNCTION public.get_honorarios_summary(
  p_mes integer,
  p_anio integer
)
RETURNS TABLE (
  total_facturado numeric,
  total_pendiente numeric,
  total_pagado numeric,
  total_parcial numeric,
  cantidad_pendiente bigint,
  cantidad_pagado bigint,
  cantidad_parcial bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(h.monto), 0) as total_facturado,
    COALESCE(SUM(CASE WHEN h.estado = 'pendiente' THEN h.saldo_actual ELSE 0 END), 0) as total_pendiente,
    COALESCE(SUM(CASE WHEN h.estado = 'pagado' THEN h.monto ELSE 0 END), 0) as total_pagado,
    COALESCE(SUM(CASE WHEN h.estado = 'parcial' THEN h.saldo_actual ELSE 0 END), 0) as total_parcial,
    COUNT(*) FILTER (WHERE h.estado = 'pendiente') as cantidad_pendiente,
    COUNT(*) FILTER (WHERE h.estado = 'pagado') as cantidad_pagado,
    COUNT(*) FILTER (WHERE h.estado = 'parcial') as cantidad_parcial
  FROM public.honorarios h
  WHERE h.periodo_mes = p_mes
    AND h.periodo_anio = p_anio;
END;
$$;

-- Comentarios
COMMENT ON TABLE public.honorarios IS 'Control mensual de honorarios por cliente';
COMMENT ON COLUMN public.honorarios.saldo_pendiente_anterior IS 'Saldo pendiente de meses anteriores o histórico pre-sistema';
COMMENT ON COLUMN public.honorarios.total_con_saldo IS 'Monto del mes más saldo pendiente anterior';
COMMENT ON COLUMN public.honorarios.saldo_actual IS 'Saldo pendiente actual (total - pagado)';
COMMENT ON FUNCTION public.sync_honorarios_to_f29 IS 'Sincroniza cambios de honorarios hacia F29';
COMMENT ON FUNCTION public.sync_f29_to_honorarios IS 'Sincroniza cambios de F29 hacia honorarios';
COMMENT ON FUNCTION public.get_honorarios_summary IS 'Obtiene resumen de honorarios del período';