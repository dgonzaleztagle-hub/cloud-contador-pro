-- Agregar columnas para folio y comentario de cierre en ordenes_trabajo
ALTER TABLE public.ordenes_trabajo 
ADD COLUMN folio SERIAL,
ADD COLUMN comentario_cierre TEXT;

-- Crear índice único para el folio
CREATE UNIQUE INDEX idx_ordenes_trabajo_folio ON public.ordenes_trabajo(folio);

-- Actualizar folios existentes (asignar números correlativos)
WITH numbered_rows AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM public.ordenes_trabajo
)
UPDATE public.ordenes_trabajo ot
SET folio = nr.row_num
FROM numbered_rows nr
WHERE ot.id = nr.id;