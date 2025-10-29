-- Tabla para valores UTM mensuales
CREATE TABLE public.utm_mensual (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  valor NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mes, anio)
);

-- Tabla para corrección monetaria del SII (matriz mes declarado vs mes que debió declarar)
CREATE TABLE public.correccion_monetaria_sii (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anio INTEGER NOT NULL,
  mes_debio_declarar INTEGER NOT NULL,
  mes_declara INTEGER NOT NULL,
  tasa NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(anio, mes_debio_declarar, mes_declara)
);

-- Agregar campos para declaraciones fuera de plazo en f29_declarations
ALTER TABLE public.f29_declarations
ADD COLUMN fuera_de_plazo BOOLEAN DEFAULT false,
ADD COLUMN fecha_limite_declaracion DATE,
ADD COLUMN dias_atraso INTEGER DEFAULT 0,
ADD COLUMN correccion_monetaria NUMERIC DEFAULT 0,
ADD COLUMN interes_moratorio NUMERIC DEFAULT 0,
ADD COLUMN multa NUMERIC DEFAULT 0,
ADD COLUMN total_recargos NUMERIC DEFAULT 0,
ADD COLUMN recargos_con_condonacion NUMERIC DEFAULT 0;

-- RLS para utm_mensual
ALTER TABLE public.utm_mensual ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view UTM"
ON public.utm_mensual
FOR SELECT
USING (true);

CREATE POLICY "Master and Admin can manage UTM"
ON public.utm_mensual
FOR ALL
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]))
WITH CHECK (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- RLS para correccion_monetaria_sii
ALTER TABLE public.correccion_monetaria_sii ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view corrección monetaria"
ON public.correccion_monetaria_sii
FOR SELECT
USING (true);

CREATE POLICY "Master and Admin can manage corrección monetaria"
ON public.correccion_monetaria_sii
FOR ALL
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]))
WITH CHECK (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Insertar algunos valores UTM de ejemplo para 2024-2025
INSERT INTO public.utm_mensual (mes, anio, valor) VALUES
(1, 2024, 65443),
(2, 2024, 65967),
(3, 2024, 66444),
(4, 2024, 66883),
(5, 2024, 67295),
(6, 2024, 67759),
(7, 2024, 68211),
(8, 2024, 68650),
(9, 2024, 69102),
(10, 2024, 69557),
(11, 2024, 70028),
(12, 2024, 70501),
(1, 2025, 70967),
(2, 2025, 71450),
(3, 2025, 71920);

-- Insertar tabla de corrección monetaria SII 2024 (ejemplo)
-- Formato: año, mes que debió declarar (1-12), mes que declara (1-12), tasa
INSERT INTO public.correccion_monetaria_sii (anio, mes_debio_declarar, mes_declara, tasa) VALUES
-- Enero
(2024, 1, 1, 0.0), (2024, 1, 2, 0.8), (2024, 1, 3, 0.7), (2024, 1, 4, 0.5), (2024, 1, 5, 0.6), (2024, 1, 6, 0.7), (2024, 1, 7, 0.7), (2024, 1, 8, 0.6), (2024, 1, 9, 0.7), (2024, 1, 10, 0.7), (2024, 1, 11, 0.7), (2024, 1, 12, 0.7),
-- Febrero  
(2024, 2, 2, 0.0), (2024, 2, 3, 0.7), (2024, 2, 4, 0.5), (2024, 2, 5, 0.6), (2024, 2, 6, 0.7), (2024, 2, 7, 0.7), (2024, 2, 8, 0.6), (2024, 2, 9, 0.7), (2024, 2, 10, 0.7), (2024, 2, 11, 0.7), (2024, 2, 12, 0.7),
-- Marzo
(2024, 3, 3, 0.0), (2024, 3, 4, 0.7), (2024, 3, 5, 0.6), (2024, 3, 6, 0.7), (2024, 3, 7, 0.7), (2024, 3, 8, 0.6), (2024, 3, 9, 0.7), (2024, 3, 10, 0.7), (2024, 3, 11, 0.7), (2024, 3, 12, 0.7),
-- Abril (ejemplo: si debió declarar en abril y declara en mayo, tasa 0.2)
(2024, 4, 4, 0.0), (2024, 4, 5, 0.2), (2024, 4, 6, 0.7), (2024, 4, 7, 0.7), (2024, 4, 8, 0.6), (2024, 4, 9, 0.7), (2024, 4, 10, 0.7), (2024, 4, 11, 0.7), (2024, 4, 12, 0.7),
-- Mayo
(2024, 5, 5, 0.0), (2024, 5, 6, 0.7), (2024, 5, 7, 0.7), (2024, 5, 8, 0.6), (2024, 5, 9, 0.7), (2024, 5, 10, 0.7), (2024, 5, 11, 0.7), (2024, 5, 12, 0.7),
-- Junio
(2024, 6, 6, 0.0), (2024, 6, 7, 0.7), (2024, 6, 8, 0.6), (2024, 6, 9, 0.7), (2024, 6, 10, 0.7), (2024, 6, 11, 0.7), (2024, 6, 12, 0.7),
-- Julio
(2024, 7, 7, 0.0), (2024, 7, 8, 0.6), (2024, 7, 9, 0.7), (2024, 7, 10, 0.7), (2024, 7, 11, 0.7), (2024, 7, 12, 0.7),
-- Agosto
(2024, 8, 8, 0.0), (2024, 8, 9, 0.7), (2024, 8, 10, 0.7), (2024, 8, 11, 0.7), (2024, 8, 12, 0.7),
-- Septiembre
(2024, 9, 9, 0.0), (2024, 9, 10, 0.7), (2024, 9, 11, 0.7), (2024, 9, 12, 0.7),
-- Octubre
(2024, 10, 10, 0.0), (2024, 10, 11, 0.7), (2024, 10, 12, 0.7),
-- Noviembre
(2024, 11, 11, 0.0), (2024, 11, 12, 0.7),
-- Diciembre
(2024, 12, 12, 0.0);