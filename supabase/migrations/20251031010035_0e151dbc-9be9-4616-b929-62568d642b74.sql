-- Tabla para almacenar valores históricos de UF diarios
CREATE TABLE IF NOT EXISTS public.uf_diaria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  valor NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies para uf_diaria
ALTER TABLE public.uf_diaria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view UF diaria"
ON public.uf_diaria
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Master and Admin can manage UF diaria"
ON public.uf_diaria
FOR ALL
TO authenticated
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]))
WITH CHECK (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Índice para búsquedas rápidas por fecha
CREATE INDEX IF NOT EXISTS idx_uf_diaria_fecha ON public.uf_diaria(fecha DESC);