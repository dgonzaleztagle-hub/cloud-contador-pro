
-- Tabla para definiciones de campos personalizados
CREATE TABLE IF NOT EXISTS client_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL, -- 'text', 'number', 'date', 'select', 'textarea'
  is_visible BOOLEAN NOT NULL DEFAULT true,
  field_options TEXT, -- Para campos tipo select, JSON con opciones
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_field_name UNIQUE (field_name)
);

-- Tabla para valores de campos personalizados por cliente
CREATE TABLE IF NOT EXISTS client_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES client_custom_fields(id) ON DELETE CASCADE,
  field_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_client_field UNIQUE (client_id, field_id)
);

-- Habilitar RLS
ALTER TABLE client_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_custom_field_values ENABLE ROW LEVEL SECURITY;

-- Políticas para client_custom_fields
CREATE POLICY "Anyone authenticated can view custom fields"
  ON client_custom_fields FOR SELECT
  USING (true);

CREATE POLICY "Master and Admin can manage custom fields"
  ON client_custom_fields FOR ALL
  USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]))
  WITH CHECK (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Políticas para client_custom_field_values
CREATE POLICY "Anyone authenticated can view custom field values"
  ON client_custom_field_values FOR SELECT
  USING (true);

CREATE POLICY "Master and Admin can manage custom field values"
  ON client_custom_field_values FOR ALL
  USING (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]))
  WITH CHECK (has_any_role(ARRAY['master'::app_role, 'admin'::app_role]));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_client_custom_field_values_updated_at
  BEFORE UPDATE ON client_custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
