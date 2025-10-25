
-- Eliminar los regímenes tributarios con los nombres exactos de la base de datos
DELETE FROM regimenes_tributarios 
WHERE nombre IN ('14 TER', 'RENTA EFECTIVA ART. 14 A', 'RENTA EFECTIVA ART. 14 B');
