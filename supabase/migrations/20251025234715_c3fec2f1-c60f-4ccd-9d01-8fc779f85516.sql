
-- Agregar restricción única al nombre del giro para evitar duplicados
ALTER TABLE giros ADD CONSTRAINT giros_nombre_unique UNIQUE (nombre);
