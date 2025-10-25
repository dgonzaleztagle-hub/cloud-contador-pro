
-- Insertar todas las comunas de Chile organizadas por región

-- Arica y Parinacota
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'Arica y Parinacota')
FROM (VALUES 
  ('Arica'), ('Camarones'), ('Putre'), ('General Lagos')
) AS t(nombre)
ON CONFLICT DO NOTHING;

-- Tarapacá
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'Tarapacá')
FROM (VALUES 
  ('Iquique'), ('Alto Hospicio'), ('Pozo Almonte'), ('Camiña'), ('Colchane'), ('Huara'), ('Pica')
) AS t(nombre)
ON CONFLICT DO NOTHING;

-- Antofagasta
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'Antofagasta')
FROM (VALUES 
  ('Antofagasta'), ('Mejillones'), ('Sierra Gorda'), ('Taltal'), ('Calama'), ('Ollagüe'), 
  ('San Pedro de Atacama'), ('Tocopilla'), ('María Elena')
) AS t(nombre)
ON CONFLICT DO NOTHING;

-- Atacama
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'Atacama')
FROM (VALUES 
  ('Copiapó'), ('Caldera'), ('Tierra Amarilla'), ('Chañaral'), ('Diego de Almagro'), 
  ('Vallenar'), ('Alto del Carmen'), ('Freirina'), ('Huasco')
) AS t(nombre)
ON CONFLICT DO NOTHING;

-- Coquimbo
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'Coquimbo')
FROM (VALUES 
  ('La Serena'), ('Coquimbo'), ('Andacollo'), ('La Higuera'), ('Paiguano'), ('Vicuña'), 
  ('Illapel'), ('Canela'), ('Los Vilos'), ('Salamanca'), ('Ovalle'), ('Combarbalá'), 
  ('Monte Patria'), ('Punitaqui'), ('Río Hurtado')
) AS t(nombre)
ON CONFLICT DO NOTHING;

-- Valparaíso
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'Valparaíso')
FROM (VALUES 
  ('Valparaíso'), ('Casablanca'), ('Concón'), ('Juan Fernández'), ('Puchuncaví'), ('Quintero'), 
  ('Viña del Mar'), ('Isla de Pascua'), ('Los Andes'), ('Calle Larga'), ('Rinconada'), ('San Esteban'), 
  ('La Ligua'), ('Cabildo'), ('Papudo'), ('Petorca'), ('Zapallar'), ('Quillota'), ('Calera'), 
  ('Hijuelas'), ('La Cruz'), ('Nogales'), ('San Antonio'), ('Algarrobo'), ('Cartagena'), 
  ('El Quisco'), ('El Tabo'), ('Santo Domingo'), ('San Felipe'), ('Catemu'), ('Llaillay'), 
  ('Panquehue'), ('Putaendo'), ('Santa María'), ('Quilpué'), ('Limache'), ('Olmué'), ('Villa Alemana')
) AS t(nombre)
ON CONFLICT DO NOTHING;

-- Metropolitana de Santiago
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'Metropolitana de Santiago')
FROM (VALUES 
  ('Santiago'), ('Cerrillos'), ('Cerro Navia'), ('Conchalí'), ('El Bosque'), ('Estación Central'), 
  ('Huechuraba'), ('Independencia'), ('La Cisterna'), ('La Florida'), ('La Granja'), ('La Pintana'), 
  ('La Reina'), ('Las Condes'), ('Lo Barnechea'), ('Lo Espejo'), ('Lo Prado'), ('Macul'), 
  ('Maipú'), ('Ñuñoa'), ('Pedro Aguirre Cerda'), ('Peñalolén'), ('Providencia'), ('Pudahuel'), 
  ('Quilicura'), ('Quinta Normal'), ('Recoleta'), ('Renca'), ('San Joaquín'), ('San Miguel'), 
  ('San Ramón'), ('Vitacura'), ('Puente Alto'), ('Pirque'), ('San José de Maipo'), ('Colina'), 
  ('Lampa'), ('Tiltil'), ('San Bernardo'), ('Buin'), ('Calera de Tango'), ('Paine'), ('Melipilla'), 
  ('Alhué'), ('Curacaví'), ('María Pinto'), ('San Pedro'), ('Talagante'), ('El Monte'), 
  ('Isla de Maipo'), ('Padre Hurtado'), ('Peñaflor')
) AS t(nombre)
ON CONFLICT DO NOTHING;

-- O'Higgins
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'O''Higgins')
FROM (VALUES 
  ('Rancagua'), ('Codegua'), ('Coinco'), ('Coltauco'), ('Doñihue'), ('Graneros'), ('Las Cabras'), 
  ('Machalí'), ('Malloa'), ('Mostazal'), ('Olivar'), ('Peumo'), ('Pichidegua'), ('Quinta de Tilcoco'), 
  ('Rengo'), ('Requínoa'), ('San Vicente'), ('Pichilemu'), ('La Estrella'), ('Litueche'), ('Marchihue'), 
  ('Navidad'), ('Paredones'), ('San Fernando'), ('Chépica'), ('Chimbarongo'), ('Lolol'), ('Nancagua'), 
  ('Palmilla'), ('Peralillo'), ('Placilla'), ('Pumanque'), ('Santa Cruz')
) AS t(nombre)
ON CONFLICT DO NOTHING;

-- Maule
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'Maule')
FROM (VALUES 
  ('Talca'), ('Constitución'), ('Curepto'), ('Empedrado'), ('Maule'), ('Pelarco'), ('Pencahue'), 
  ('Río Claro'), ('San Clemente'), ('San Rafael'), ('Cauquenes'), ('Chanco'), ('Pelluhue'), 
  ('Curicó'), ('Hualañé'), ('Licantén'), ('Molina'), ('Rauco'), ('Romeral'), ('Sagrada Familia'), 
  ('Teno'), ('Vichuquén'), ('Linares'), ('Colbún'), ('Longaví'), ('Parral'), ('Retiro'), 
  ('San Javier'), ('Villa Alegre'), ('Yerbas Buenas')
) AS t(nombre)
ON CONFLICT DO NOTHING;

-- Ñuble
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'Ñuble')
FROM (VALUES 
  ('Chillán'), ('Bulnes'), ('Cobquecura'), ('Coelemu'), ('Coihueco'), ('Chillán Viejo'), ('El Carmen'), 
  ('Ninhue'), ('Ñiquén'), ('Pemuco'), ('Pinto'), ('Portezuelo'), ('Quillón'), ('Quirihue'), 
  ('Ránquil'), ('San Carlos'), ('San Fabián'), ('San Ignacio'), ('San Nicolás'), ('Treguaco'), ('Yungay')
) AS t(nombre)
ON CONFLICT DO NOTHING;

-- Biobío
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'Biobío')
FROM (VALUES 
  ('Concepción'), ('Coronel'), ('Chiguayante'), ('Florida'), ('Hualqui'), ('Lota'), ('Penco'), 
  ('San Pedro de la Paz'), ('Santa Juana'), ('Talcahuano'), ('Tomé'), ('Hualpén'), ('Lebu'), 
  ('Arauco'), ('Cañete'), ('Contulmo'), ('Curanilahue'), ('Los Álamos'), ('Tirúa'), ('Los Ángeles'), 
  ('Antuco'), ('Cabrero'), ('Laja'), ('Mulchén'), ('Nacimiento'), ('Negrete'), ('Quilaco'), 
  ('Quilleco'), ('San Rosendo'), ('Santa Bárbara'), ('Tucapel'), ('Yumbel'), ('Alto Biobío')
) AS t(nombre)
ON CONFLICT DO NOTHING;

-- La Araucanía
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'La Araucanía')
FROM (VALUES 
  ('Temuco'), ('Carahue'), ('Cunco'), ('Curarrehue'), ('Freire'), ('Galvarino'), ('Gorbea'), 
  ('Lautaro'), ('Loncoche'), ('Melipeuco'), ('Nueva Imperial'), ('Padre Las Casas'), ('Perquenco'), 
  ('Pitrufquén'), ('Pucón'), ('Saavedra'), ('Teodoro Schmidt'), ('Toltén'), ('Vilcún'), ('Villarrica'), 
  ('Cholchol'), ('Angol'), ('Collipulli'), ('Curacautín'), ('Ercilla'), ('Lonquimay'), ('Los Sauces'), 
  ('Lumaco'), ('Purén'), ('Renaico'), ('Traiguén'), ('Victoria')
) AS t(nombre)
ON CONFLICT DO NOTHING;

-- Los Ríos
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'Los Ríos')
FROM (VALUES 
  ('Valdivia'), ('Corral'), ('Lanco'), ('Los Lagos'), ('Máfil'), ('Mariquina'), ('Paillaco'), 
  ('Panguipulli'), ('La Unión'), ('Futrono'), ('Lago Ranco'), ('Río Bueno')
) AS t(nombre)
ON CONFLICT DO NOTHING;

-- Los Lagos
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'Los Lagos')
FROM (VALUES 
  ('Puerto Montt'), ('Calbuco'), ('Cochamó'), ('Fresia'), ('Frutillar'), ('Los Muermos'), 
  ('Llanquihue'), ('Maullín'), ('Puerto Varas'), ('Castro'), ('Ancud'), ('Chonchi'), ('Curaco de Vélez'), 
  ('Dalcahue'), ('Puqueldón'), ('Queilén'), ('Quellón'), ('Quemchi'), ('Quinchao'), ('Osorno'), 
  ('Puerto Octay'), ('Purranque'), ('Puyehue'), ('Río Negro'), ('San Juan de la Costa'), ('San Pablo'), 
  ('Chaitén'), ('Futaleufú'), ('Hualaihué'), ('Palena')
) AS t(nombre)
ON CONFLICT DO NOTHING;

-- Aysén
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'Aysén')
FROM (VALUES 
  ('Coyhaique'), ('Lago Verde'), ('Aysén'), ('Cisnes'), ('Guaitecas'), ('Cochrane'), ('O''Higgins'), 
  ('Tortel'), ('Chile Chico'), ('Río Ibáñez')
) AS t(nombre)
ON CONFLICT DO NOTHING;

-- Magallanes
INSERT INTO ciudades (nombre, region_id) 
SELECT nombre, (SELECT id FROM regiones WHERE nombre = 'Magallanes')
FROM (VALUES 
  ('Punta Arenas'), ('Laguna Blanca'), ('Río Verde'), ('San Gregorio'), ('Cabo de Hornos'), 
  ('Antártica'), ('Porvenir'), ('Primavera'), ('Timaukel'), ('Natales'), ('Torres del Paine')
) AS t(nombre)
ON CONFLICT DO NOTHING;
