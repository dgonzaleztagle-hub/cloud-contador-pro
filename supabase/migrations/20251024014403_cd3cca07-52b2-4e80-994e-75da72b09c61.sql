-- Agregar campo estado_honorarios a la tabla f29_declarations
ALTER TABLE public.f29_declarations
ADD COLUMN estado_honorarios text NOT NULL DEFAULT 'pendiente' CHECK (estado_honorarios IN ('pendiente', 'pagado'));