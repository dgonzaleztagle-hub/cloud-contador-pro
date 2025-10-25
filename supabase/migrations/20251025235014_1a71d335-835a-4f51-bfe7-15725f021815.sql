
-- Eliminar regímenes tributarios específicos
DELETE FROM regimenes_tributarios 
WHERE nombre IN ('14ter', 'renta efectiva', 'art14a', 'art14b', '14 TER', 'Renta Efectiva', 'Art14a', 'Art14b', 'ART14A', 'ART14B', '14TER', 'RENTA EFECTIVA');
