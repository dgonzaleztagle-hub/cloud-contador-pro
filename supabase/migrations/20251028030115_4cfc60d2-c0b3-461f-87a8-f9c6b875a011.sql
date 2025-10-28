-- Agregar campo para fecha de sincronización con SII
ALTER TABLE public.f29_declarations 
ADD COLUMN ultima_sincronizacion_sii timestamp with time zone DEFAULT NULL;