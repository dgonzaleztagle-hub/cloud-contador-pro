-- Agregar campos de fecha_inicio y fecha_fin para licencias médicas
ALTER TABLE public.worker_events
ADD COLUMN fecha_inicio DATE,
ADD COLUMN fecha_fin DATE;

-- Agregar comentario para documentar el uso
COMMENT ON COLUMN public.worker_events.fecha_inicio IS 'Fecha de inicio para licencias médicas (puede abarcar múltiples meses)';
COMMENT ON COLUMN public.worker_events.fecha_fin IS 'Fecha de fin para licencias médicas (puede abarcar múltiples meses)';