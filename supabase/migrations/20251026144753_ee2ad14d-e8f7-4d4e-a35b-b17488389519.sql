-- Agregar campo tasa_ppm a la tabla f29_declarations
ALTER TABLE public.f29_declarations
ADD COLUMN tasa_ppm numeric DEFAULT 0;