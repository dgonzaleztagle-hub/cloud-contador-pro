-- Crear tabla de tipos de Declaraciones Juradas F22
CREATE TABLE IF NOT EXISTS public.f22_tipos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo text NOT NULL UNIQUE, -- DJ 1887, DJ 1879, etc.
  nombre text NOT NULL,
  descripcion text,
  fecha_limite_dia integer NOT NULL, -- Día del mes
  fecha_limite_mes integer NOT NULL, -- Mes (3 para marzo, etc.)
  regimen_tributario text[], -- Array de regímenes que deben presentarla
  es_comun boolean DEFAULT true,
  activo boolean DEFAULT true,
  orden integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear tabla de seguimiento de declaraciones F22
CREATE TABLE IF NOT EXISTS public.f22_declaraciones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  f22_tipo_id uuid NOT NULL REFERENCES public.f22_tipos(id) ON DELETE CASCADE,
  anio_tributario integer NOT NULL, -- 2026 para movimientos de 2025
  estado text NOT NULL DEFAULT 'pendiente', -- pendiente, presentada, aceptada, observada
  fecha_presentacion date,
  fecha_aceptacion date,
  observaciones text,
  oculta boolean DEFAULT false, -- Para ocultar DJ que no se presentarán
  notificacion_enviada boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(client_id, f22_tipo_id, anio_tributario)
);

-- Habilitar RLS
ALTER TABLE public.f22_tipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.f22_declaraciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para f22_tipos
CREATE POLICY "Anyone authenticated can view f22_tipos"
ON public.f22_tipos
FOR SELECT
USING (true);

CREATE POLICY "Master and Admin can manage f22_tipos"
ON public.f22_tipos
FOR ALL
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]))
WITH CHECK (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Políticas RLS para f22_declaraciones
CREATE POLICY "Master and Admin can view all f22_declaraciones"
ON public.f22_declaraciones
FOR SELECT
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can insert f22_declaraciones"
ON public.f22_declaraciones
FOR INSERT
WITH CHECK (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can update f22_declaraciones"
ON public.f22_declaraciones
FOR UPDATE
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Master and Admin can delete f22_declaraciones"
ON public.f22_declaraciones
FOR DELETE
USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

CREATE POLICY "Clients can view own f22_declaraciones"
ON public.f22_declaraciones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = f22_declaraciones.client_id
    AND clients.user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_f22_declaraciones_updated_at
BEFORE UPDATE ON public.f22_declaraciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar tipos de DJ comunes
INSERT INTO public.f22_tipos (codigo, nombre, descripcion, fecha_limite_dia, fecha_limite_mes, regimen_tributario, orden) VALUES
('DJ 1887', 'Sueldos y Remuneraciones', 'Declaración de sueldos y remuneraciones pagadas', 15, 3, ARRAY['Todos'], 1),
('DJ 1879', 'Honorarios y Retenciones', 'Declaración de honorarios pagados y retenciones efectuadas', 15, 3, ARRAY['Todos'], 2),
('DJ 1947', 'Renta Líquida y Capital Propio', 'Determinación de la renta líquida imponible y capital propio tributario', 29, 3, ARRAY['Renta atribuida', 'Semi integrado'], 3),
('DJ 1926', 'Balance General y Antecedentes', 'Balance general y antecedentes para la determinación de la renta líquida', 29, 3, ARRAY['Renta atribuida', 'Semi integrado'], 4),
('DJ 1948', 'Capital Propio Simplificado', 'Determinación del capital propio tributario simplificado', 29, 3, ARRAY['Pro Pyme General', 'Pro Pyme Transparente'], 5),
('DJ 1943', 'Rentas o Créditos Distribuidos SAC', 'Rentas o créditos distribuidos por sociedades anónimas cerradas', 29, 3, ARRAY['Semi integrado'], 6),
('DJ 1835', 'Impuesto Adicional Pagos Exterior', 'Impuesto adicional por pagos o créditos al exterior', 15, 3, ARRAY['Todos'], 7),
('DJ 1909', 'Aportes y Retiros de Socios', 'Aportes y retiros efectuados por empresarios y socios', 29, 3, ARRAY['Renta atribuida', 'Semi integrado', 'Pro Pyme General'], 8)
ON CONFLICT (codigo) DO NOTHING;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_f22_declaraciones_client_id ON public.f22_declaraciones(client_id);
CREATE INDEX IF NOT EXISTS idx_f22_declaraciones_anio_tributario ON public.f22_declaraciones(anio_tributario);
CREATE INDEX IF NOT EXISTS idx_f22_declaraciones_estado ON public.f22_declaraciones(estado);
CREATE INDEX IF NOT EXISTS idx_f22_declaraciones_oculta ON public.f22_declaraciones(oculta);