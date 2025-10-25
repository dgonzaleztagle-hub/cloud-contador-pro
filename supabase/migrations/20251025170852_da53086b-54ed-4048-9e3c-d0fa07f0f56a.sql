-- Agregar columna saldo_honorarios_pendiente a clients
-- Este campo almacenará las deudas anteriores antes de comenzar el sistema
ALTER TABLE public.clients
ADD COLUMN saldo_honorarios_pendiente numeric DEFAULT 0 NOT NULL;