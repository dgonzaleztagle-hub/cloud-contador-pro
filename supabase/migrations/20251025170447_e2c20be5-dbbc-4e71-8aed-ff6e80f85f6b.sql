-- Agregar columna estado_declaracion a f29_declarations
ALTER TABLE public.f29_declarations
ADD COLUMN estado_declaracion text NOT NULL DEFAULT 'pendiente'
CHECK (estado_declaracion IN ('declarado', 'pendiente', 'guardado', 'girado'));