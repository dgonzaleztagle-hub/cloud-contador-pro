-- Eliminar columnas de montos de cotizaciones_previsionales
ALTER TABLE public.cotizaciones_previsionales
DROP COLUMN IF EXISTS monto_total,
DROP COLUMN IF EXISTS monto_pagado;

-- Comentarios para documentar el cambio
COMMENT ON TABLE public.cotizaciones_previsionales IS 'Cotizaciones previsionales por período. Los montos se calculan desde cotizaciones_trabajadores.';
COMMENT ON COLUMN public.cotizaciones_previsionales.estado IS 'Estado global: pendiente (ninguno pagado), parcial (algunos pagados), pagado (todos pagados)';