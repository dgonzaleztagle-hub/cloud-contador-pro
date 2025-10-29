-- Agregar campo 'resultado' para separar ACEPTADA/OBSERVADA del estado PENDIENTE/DECLARADA
ALTER TABLE public.f22_declaraciones
ADD COLUMN resultado TEXT DEFAULT NULL;

-- Agregar constraint para validar los valores permitidos
ALTER TABLE public.f22_declaraciones
ADD CONSTRAINT f22_declaraciones_resultado_check 
CHECK (resultado IS NULL OR resultado IN ('aceptada', 'observada'));

-- Actualizar el constraint del campo estado para que solo acepte pendiente/declarada
ALTER TABLE public.f22_declaraciones
DROP CONSTRAINT IF EXISTS f22_declaraciones_estado_check;

ALTER TABLE public.f22_declaraciones
ADD CONSTRAINT f22_declaraciones_estado_check 
CHECK (estado IN ('pendiente', 'declarada'));

-- Comentarios para documentar
COMMENT ON COLUMN public.f22_declaraciones.estado IS 'Estado de la declaración: pendiente o declarada';
COMMENT ON COLUMN public.f22_declaraciones.resultado IS 'Resultado de la declaración: aceptada u observada (solo aplica cuando está declarada)';