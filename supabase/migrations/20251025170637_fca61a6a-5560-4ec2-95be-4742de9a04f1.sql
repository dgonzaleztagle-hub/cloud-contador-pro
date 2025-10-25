-- Crear tabla de regiones de Chile
CREATE TABLE IF NOT EXISTS public.regiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  orden integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Crear tabla de ciudades
CREATE TABLE IF NOT EXISTS public.ciudades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  region_id uuid REFERENCES public.regiones(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(nombre, region_id)
);

-- Crear tabla de giros con códigos de actividad
CREATE TABLE IF NOT EXISTS public.giros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  cod_actividad text,
  created_at timestamp with time zone DEFAULT now()
);

-- Crear tabla de regímenes tributarios
CREATE TABLE IF NOT EXISTS public.regimenes_tributarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ciudades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regimenes_tributarios ENABLE ROW LEVEL SECURITY;

-- Policies para lectura pública (authenticated users)
CREATE POLICY "Authenticated users can view regiones"
  ON public.regiones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view ciudades"
  ON public.ciudades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view giros"
  ON public.giros FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view regimenes"
  ON public.regimenes_tributarios FOR SELECT
  TO authenticated
  USING (true);

-- Policies para inserción (Master y Admin)
CREATE POLICY "Master and Admin can insert giros"
  ON public.giros FOR INSERT
  TO authenticated
  WITH CHECK (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can insert regimenes"
  ON public.regimenes_tributarios FOR INSERT
  TO authenticated
  WITH CHECK (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Insertar regiones de Chile
INSERT INTO public.regiones (nombre, orden) VALUES
  ('Arica y Parinacota', 1),
  ('Tarapacá', 2),
  ('Antofagasta', 3),
  ('Atacama', 4),
  ('Coquimbo', 5),
  ('Valparaíso', 6),
  ('Metropolitana de Santiago', 7),
  ('O''Higgins', 8),
  ('Maule', 9),
  ('Ñuble', 10),
  ('Biobío', 11),
  ('La Araucanía', 12),
  ('Los Ríos', 13),
  ('Los Lagos', 14),
  ('Aysén', 15),
  ('Magallanes', 16)
ON CONFLICT (nombre) DO NOTHING;

-- Insertar algunas ciudades principales por región
INSERT INTO public.ciudades (nombre, region_id) 
SELECT 'Arica', id FROM public.regiones WHERE nombre = 'Arica y Parinacota'
UNION ALL
SELECT 'Iquique', id FROM public.regiones WHERE nombre = 'Tarapacá'
UNION ALL
SELECT 'Antofagasta', id FROM public.regiones WHERE nombre = 'Antofagasta'
UNION ALL
SELECT 'Calama', id FROM public.regiones WHERE nombre = 'Antofagasta'
UNION ALL
SELECT 'Copiapó', id FROM public.regiones WHERE nombre = 'Atacama'
UNION ALL
SELECT 'La Serena', id FROM public.regiones WHERE nombre = 'Coquimbo'
UNION ALL
SELECT 'Coquimbo', id FROM public.regiones WHERE nombre = 'Coquimbo'
UNION ALL
SELECT 'Valparaíso', id FROM public.regiones WHERE nombre = 'Valparaíso'
UNION ALL
SELECT 'Viña del Mar', id FROM public.regiones WHERE nombre = 'Valparaíso'
UNION ALL
SELECT 'Santiago', id FROM public.regiones WHERE nombre = 'Metropolitana de Santiago'
UNION ALL
SELECT 'Puente Alto', id FROM public.regiones WHERE nombre = 'Metropolitana de Santiago'
UNION ALL
SELECT 'Maipú', id FROM public.regiones WHERE nombre = 'Metropolitana de Santiago'
UNION ALL
SELECT 'La Florida', id FROM public.regiones WHERE nombre = 'Metropolitana de Santiago'
UNION ALL
SELECT 'Rancagua', id FROM public.regiones WHERE nombre = 'O''Higgins'
UNION ALL
SELECT 'Talca', id FROM public.regiones WHERE nombre = 'Maule'
UNION ALL
SELECT 'Curicó', id FROM public.regiones WHERE nombre = 'Maule'
UNION ALL
SELECT 'Chillán', id FROM public.regiones WHERE nombre = 'Ñuble'
UNION ALL
SELECT 'Concepción', id FROM public.regiones WHERE nombre = 'Biobío'
UNION ALL
SELECT 'Talcahuano', id FROM public.regiones WHERE nombre = 'Biobío'
UNION ALL
SELECT 'Los Ángeles', id FROM public.regiones WHERE nombre = 'Biobío'
UNION ALL
SELECT 'Temuco', id FROM public.regiones WHERE nombre = 'La Araucanía'
UNION ALL
SELECT 'Valdivia', id FROM public.regiones WHERE nombre = 'Los Ríos'
UNION ALL
SELECT 'Puerto Montt', id FROM public.regiones WHERE nombre = 'Los Lagos'
UNION ALL
SELECT 'Osorno', id FROM public.regiones WHERE nombre = 'Los Lagos'
UNION ALL
SELECT 'Coyhaique', id FROM public.regiones WHERE nombre = 'Aysén'
UNION ALL
SELECT 'Punta Arenas', id FROM public.regiones WHERE nombre = 'Magallanes'
ON CONFLICT (nombre, region_id) DO NOTHING;

-- Insertar algunos regímenes tributarios comunes
INSERT INTO public.regimenes_tributarios (nombre) VALUES
  ('PRO PYME GRAL 14D'),
  ('PRO PYME TRANSPARENTE 14D-8'),
  ('RENTA EFECTIVA ART. 14 A'),
  ('RENTA EFECTIVA ART. 14 B'),
  ('RENTA PRESUNTA'),
  ('14 TER')
ON CONFLICT (nombre) DO NOTHING;