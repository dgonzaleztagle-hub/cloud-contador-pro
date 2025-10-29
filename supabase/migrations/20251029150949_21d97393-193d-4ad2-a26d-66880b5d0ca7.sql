-- Agregar campo sueldo_base a la tabla rrhh_workers
ALTER TABLE public.rrhh_workers
ADD COLUMN sueldo_base numeric DEFAULT 0;