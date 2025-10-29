-- Add partner/socio fields to clients table
ALTER TABLE public.clients
ADD COLUMN socio_1_nombre TEXT,
ADD COLUMN socio_1_rut TEXT,
ADD COLUMN socio_1_clave_sii TEXT,
ADD COLUMN socio_2_nombre TEXT,
ADD COLUMN socio_2_rut TEXT,
ADD COLUMN socio_2_clave_sii TEXT,
ADD COLUMN socio_3_nombre TEXT,
ADD COLUMN socio_3_rut TEXT,
ADD COLUMN socio_3_clave_sii TEXT;

-- Add RCV (Registro de Compras y Ventas) fields for manual entry
ALTER TABLE public.clients
ADD COLUMN rcv_ventas NUMERIC DEFAULT 0,
ADD COLUMN rcv_compras NUMERIC DEFAULT 0;