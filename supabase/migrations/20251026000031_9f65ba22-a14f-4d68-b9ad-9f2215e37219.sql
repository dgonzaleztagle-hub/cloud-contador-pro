
-- Tabla para eventos individuales de trabajadores (atrasos, faltas, permisos, anticipos)
CREATE TABLE IF NOT EXISTS worker_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES rrhh_workers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('atraso', 'falta_completa', 'falta_media', 'permiso_horas', 'permiso_medio_dia', 'permiso_completo', 'anticipo')),
  event_date DATE NOT NULL,
  periodo_mes INTEGER NOT NULL CHECK (periodo_mes >= 1 AND periodo_mes <= 12),
  periodo_anio INTEGER NOT NULL,
  cantidad NUMERIC NOT NULL DEFAULT 0, -- minutos para atrasos/permisos, 1 para faltas, monto para anticipos
  descripcion TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para mejor performance
CREATE INDEX idx_worker_events_worker_id ON worker_events(worker_id);
CREATE INDEX idx_worker_events_client_id ON worker_events(client_id);
CREATE INDEX idx_worker_events_periodo ON worker_events(periodo_anio, periodo_mes);

-- Habilitar RLS
ALTER TABLE worker_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Master y Admin pueden ver todos los eventos
CREATE POLICY "Master and Admin can view all events"
  ON worker_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('master', 'admin')
    )
  );

-- Clientes pueden ver eventos de sus propios trabajadores
CREATE POLICY "Clients can view own worker events"
  ON worker_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = worker_events.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Master y Admin pueden insertar eventos
CREATE POLICY "Master and Admin can insert events"
  ON worker_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('master', 'admin')
    )
  );

-- Clientes pueden insertar eventos para sus trabajadores
CREATE POLICY "Clients can insert events for own workers"
  ON worker_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = worker_events.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Master y Admin pueden actualizar eventos
CREATE POLICY "Master and Admin can update events"
  ON worker_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('master', 'admin')
    )
  );

-- Master y Admin pueden eliminar eventos
CREATE POLICY "Master and Admin can delete events"
  ON worker_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('master', 'admin')
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_worker_events_updated_at
  BEFORE UPDATE ON worker_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
