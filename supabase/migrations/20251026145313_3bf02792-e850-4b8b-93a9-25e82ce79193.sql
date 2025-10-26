-- Agregar columna licencia_medica a la tabla worker_events para soportar el nuevo tipo
-- No es necesario modificar la estructura, ya que worker_events ya usa event_type como text
-- Solo necesitamos asegurarnos de que la aplicación maneje 'licencia_medica' como un tipo válido

-- Comentario: El campo event_type en worker_events ya es de tipo text, 
-- por lo que puede almacenar 'licencia_medica' sin cambios en la estructura