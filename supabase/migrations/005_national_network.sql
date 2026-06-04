-- ================================================================
-- Migration 005: Red Nacional Foton México
-- 22 grupos · 35 sucursales · 4 segmentos · modelos por segmento
-- ================================================================

-- ── NUEVAS TABLAS ────────────────────────────────────────────

-- Segmentos comerciales
CREATE TABLE IF NOT EXISTS segmentos (
  id text PRIMARY KEY, -- 'pv' | 'mdt' | 'hdt' | 'ev'
  nombre text NOT NULL,
  nombre_completo text NOT NULL,
  color text DEFAULT '#185FA5',
  orden int DEFAULT 0
);

-- Modelos por segmento (editables desde el panel)
CREATE TABLE IF NOT EXISTS modelos_segmento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segmento_id text NOT NULL REFERENCES segmentos(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  nombre text,
  activo boolean DEFAULT true,
  orden int DEFAULT 0,
  UNIQUE(segmento_id, codigo)
);

-- Sucursales (ubicaciones físicas, para el mapa)
CREATE TABLE IF NOT EXISTS sucursales (
  id text PRIMARY KEY,
  distribuidor_id text NOT NULL REFERENCES distribuidores(id) ON DELETE CASCADE,
  ciudad text NOT NULL,
  estado text NOT NULL,
  lat numeric,
  lng numeric,
  maps_url text,
  activo boolean DEFAULT true
);

-- Asignaciones: regional → grupo → segmento
CREATE TABLE IF NOT EXISTS asignaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  distribuidor_id text NOT NULL REFERENCES distribuidores(id) ON DELETE CASCADE,
  segmento_id text NOT NULL REFERENCES segmentos(id) ON DELETE CASCADE,
  UNIQUE(usuario_id, distribuidor_id, segmento_id)
);

-- Columna segmento en usuarios (para directores y regionales)
ALTER TABLE distribuidores ADD COLUMN IF NOT EXISTS estado text;
ALTER TABLE distribuidores ADD COLUMN IF NOT EXISTS ciudad text;
ALTER TABLE distribuidores ADD COLUMN IF NOT EXISTS maps_url text;
ALTER TABLE distribuidores ADD COLUMN IF NOT EXISTS lat numeric;
ALTER TABLE distribuidores ADD COLUMN IF NOT EXISTS lng numeric;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS segmento_id text REFERENCES segmentos(id);

-- ── SEGMENTOS ────────────────────────────────────────────────
INSERT INTO segmentos (id, nombre, nombre_completo, color, orden) VALUES
  ('pv',  'P&V',     'Pick-ups & Vans',          '#7C3D1A', 1),
  ('mdt', 'MDT/LDT', 'Ligeros y Medianos',        '#185FA5', 2),
  ('hdt', 'HDT',     'Pesados',                   '#042C53', 3),
  ('ev',  'EV',      'Eléctricos',               '#1A7C4F', 4)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  nombre_completo = EXCLUDED.nombre_completo,
  color = EXCLUDED.color,
  orden = EXCLUDED.orden;

-- ── MODELOS POR SEGMENTO ─────────────────────────────────────

-- P&V
INSERT INTO modelos_segmento (segmento_id, codigo, orden) VALUES
  ('pv', 'TM3',                    1),
  ('pv', 'Tunland G7 4K22-DC',     2),
  ('pv', 'Tunland G7 Chasis',      3),
  ('pv', 'Tunland G7 MT Gasolina', 4),
  ('pv', 'Tunland V7 4X2',         5),
  ('pv', 'Tunland V7 4X4',         6),
  ('pv', 'HiVan Pasajeros',        7),
  ('pv', 'VIEW CS2 Panel',         8),
  ('pv', 'VIEW CS2 Pasajeros',     9)
ON CONFLICT (segmento_id, codigo) DO NOTHING;

-- MDT/LDT
INSERT INTO modelos_segmento (segmento_id, codigo, orden) VALUES
  ('mdt', 'S3-E6 MT',   1),
  ('mdt', 'S3-E6 AMT',  2),
  ('mdt', 'S5-E6 MT',   3),
  ('mdt', 'S5-E6 AMT',  4),
  ('mdt', 'S6-E6 MT',   5),
  ('mdt', 'S8-E6 AMT',  6),
  ('mdt', 'S12-E6',     7),
  ('mdt', 'S20',        8)
ON CONFLICT (segmento_id, codigo) DO NOTHING;

-- HDT
INSERT INTO modelos_segmento (segmento_id, codigo, orden) VALUES
  ('hdt', 'EST-A 6X4',         1),
  ('hdt', 'EST-A 6X4 X13-E6',  2),
  ('hdt', 'EST-A 3253-(CNG)',   3),
  ('hdt', 'EST-S38 AMT 6X4',   4),
  ('hdt', 'Galaxy 3256',       5),
  ('hdt', 'Galaxus',           6),
  ('hdt', 'S35',               7)
ON CONFLICT (segmento_id, codigo) DO NOTHING;

-- EV
INSERT INTO modelos_segmento (segmento_id, codigo, orden) VALUES
  ('ev', 'TUNLAND EV',            1),
  ('ev', 'TM EV',                 2),
  ('ev', 'S3 EV',                 3),
  ('ev', 'EST-EV',                4),
  ('ev', 'HiVan EV-Pasajeros',    5),
  ('ev', 'HiVan EV-Panel',        6)
ON CONFLICT (segmento_id, codigo) DO NOTHING;

-- ── GRUPOS / DISTRIBUIDORES (red nacional completa) ──────────
-- Usando INSERT ... ON CONFLICT para preservar datos existentes

INSERT INTO distribuidores (id, nombre, plaza, grupo, contacto, segmento, status, estado, ciudad) VALUES
  ('delsureste',    'Auto Servicios Mecánicos Del Sureste SA',   'La Paz',            'Del Sureste',   null, 'MDT/LDT', 'activo', 'BCN', 'La Paz'),
  ('asturcar',      'Autos EMCG SA de CV',                       'Puebla',            'Asturcar',      null, 'MDT/LDT', 'activo', 'PUE', 'Puebla'),
  ('motornation',   'Autos Orientales Picacho',                  'Ciudad de México',  'Motornation',   null, 'P&V',     'activo', 'MEX', 'Ciudad de México'),
  ('tang',          'Autos y Camiones Asia Central SA de CV',    'San Luis Potosí',   'Tangamanga',    null, 'MDT/LDT', 'activo', 'SLP', 'San Luis Potosí'),
  ('arg',           'Arg Broker S.A. de C.V.',                   'Tamaulipas',        'ARG',           null, 'MDT/LDT', 'activo', 'TAM', 'Tamaulipas'),
  ('astrocamiones', 'Built 2 Work Motors SA de CV',              'Toluca',            'Astrocamiones', null, 'MDT/LDT', 'activo', 'MEX', 'Toluca'),
  ('bavi',          'Burk Automotriz SA de CV',                  'Uruapan',           'BAVI',          null, 'MDT/LDT', 'activo', 'MIC', 'Uruapan'),
  ('mh',            'Camiones Hermt SA de C.V.',                 'Aguascalientes',    'Mh',            null, 'MDT/LDT', 'activo', 'AGS', 'Aguascalientes'),
  ('adacari',       'Camiones Innovadores Del Pacífico SA de CV','Tepic',             'Adacari',       null, 'MDT/LDT', 'activo', 'NAY', 'Tepic'),
  ('cmv',           'Camiones Metropolitanos del Valle SA de CV','Tlalnepantla',      'CMV',           null, 'MDT/LDT', 'activo', 'MEX', 'Tlalnepantla'),
  ('ruano',         'Camiones Metropolitanos GR SA de CV',       'Centro-Sur',        'Ruano',         null, 'MDT/LDT', 'activo', 'CDM', 'Insurgentes'),
  ('plascencia',    'Camiones Orientales de León SA de CV',      'León',              'Plascencia',    null, 'MDT/LDT', 'activo', 'GTO', 'León'),
  ('prem',          'Camiones Premium del Centro S de RL de CV', 'Querétaro',         'Premium',       null, 'MDT/LDT', 'activo', 'QUE', 'Querétaro'),
  ('bours',         'Camiones y Tractocamiones de Sonora SA de CV','Hermosillo',      'Bours',         null, 'MDT/LDT', 'activo', 'SON', 'Hermosillo'),
  ('policon',       'Policon (Eco Trucks / Policars)',            'Centro',            'Policon',       null, 'MDT/LDT', 'activo', 'PUE', 'Puebla'),
  ('deras',         'GAD Vehículos Comerciales S.A. DE C.V',     'Zacatecas',         'Deras',         null, 'MDT/LDT', 'activo', 'ZAC', 'Zacatecas'),
  ('gcm',           'Grupo Carrocero Milenio',                   'Tula',              'GCM',           null, 'MDT/LDT', 'activo', 'HID', 'Tula'),
  ('jimenez',       'Jiménez Autocamiones SA de CV',             'Jalisco/Colima',    'Jiménez',       null, 'MDT/LDT', 'activo', 'JAL', 'Zapopan'),
  ('grumar',        'Profesional en Servicio y Diagnóstico SA',  'Sur-Sureste',       'Grumar',        null, 'MDT/LDT', 'activo', 'OAX', 'Oaxaca'),
  ('jcmc',          'Ssandier SA de CV / Xian Motors SA de CV',  'Guadalajara',       'JCMC/Xian',     null, 'MDT/LDT', 'activo', 'JAL', 'Guadalajara'),
  ('enerkom',       'Vehículos Comerciales Península SA de CV',  'Sureste',           'Enerkom',       null, 'MDT/LDT', 'activo', 'ROO', 'Cancún'),
  ('velcen',        'Velcen Motors SA de CV',                    'Escobedo',          'Velcen',        null, 'MDT/LDT', 'activo', 'NLE', 'Escobedo')
ON CONFLICT (id) DO UPDATE SET
  nombre  = EXCLUDED.nombre,
  grupo   = EXCLUDED.grupo,
  estado  = EXCLUDED.estado,
  ciudad  = EXCLUDED.ciudad;

-- ── SUCURSALES (35 ubicaciones físicas) ─────────────────────
INSERT INTO sucursales (id, distribuidor_id, ciudad, estado) VALUES
  -- Del Sureste
  ('delsureste-lapaz',         'delsureste',  'La Paz',             'BCN'),
  -- Asturcar
  ('asturcar-puebla',          'asturcar',    'Puebla',             'PUE'),
  -- Motornation
  ('motornation-cdmx',         'motornation', 'Ciudad de México',   'MEX'),
  -- Tangamanga
  ('tang-slp',                 'tang',        'San Luis Potosí',    'SLP'),
  -- ARG
  ('arg-tamaulipas',           'arg',         'Tamaulipas',         'TAM'),
  -- Astrocamiones
  ('astrocamiones-toluca',     'astrocamiones','Toluca',            'MEX'),
  -- BAVI
  ('bavi-uruapan',             'bavi',        'Uruapan',            'MIC'),
  -- Mh
  ('mh-aguascalientes',        'mh',          'Aguascalientes',     'AGS'),
  -- Adacari
  ('adacari-tepic',            'adacari',     'Tepic',              'NAY'),
  -- CMV
  ('cmv-tlalnepantla',         'cmv',         'Tlalnepantla',       'MEX'),
  -- Ruano
  ('ruano-insurgentes',        'ruano',       'Insurgentes CDMX',   'CDM'),
  ('ruano-acapulco',           'ruano',       'Acapulco',           'GRO'),
  -- Plascencia
  ('plascencia-leon',          'plascencia',  'León',               'GTO'),
  -- Premium
  ('prem-queretaro',           'prem',        'Querétaro',          'QUE'),
  ('prem-constituyentes',      'prem',        'Constituyentes QRO', 'QUE'),
  -- Bours
  ('bours-hermosillo',         'bours',       'Hermosillo',         'SON'),
  ('bours-losmochis',          'bours',       'Los Mochis',         'SON'),
  -- Policon / Eco Trucks
  ('policon-puebla',           'policon',     'Puebla',             'PUE'),
  ('policon-tlaxcala',         'policon',     'Tlaxcala',           'TLA'),
  -- Policon / Policars
  ('policon-cuernavaca',       'policon',     'Cuernavaca',         'MOR'),
  -- Deras / GAD
  ('deras-zacatecas',          'deras',       'Zacatecas',          'ZAC'),
  -- GCM
  ('gcm-tula',                 'gcm',         'Tula',               'HID'),
  -- Jiménez
  ('jimenez-colima',           'jimenez',     'Colima',             'COL'),
  ('jimenez-gonzalezgallo',    'jimenez',     'González Gallo',     'JAL'),
  ('jimenez-tlaquepaque',      'jimenez',     'Tlaquepaque',        'JAL'),
  ('jimenez-zapopan',          'jimenez',     'Zapopan',            'JAL'),
  -- Grumar
  ('grumar-oaxaca',            'grumar',      'Oaxaca',             'OAX'),
  ('grumar-tapachula',         'grumar',      'Tapachula',          'CHP'),
  ('grumar-tuxtla',            'grumar',      'Tuxtla Gutiérrez',   'CHP'),
  ('grumar-villahermosa',      'grumar',      'Villahermosa',       'TAB'),
  -- JCMC / Ssandier / Xian
  ('jcmc-zapopan',             'jcmc',        'Zapopan',            'JAL'),
  ('jcmc-guadalajara',         'jcmc',        'Guadalajara',        'JAL'),
  -- Enerkom / VCP
  ('enerkom-cancun',           'enerkom',     'Cancún',             'ROO'),
  ('enerkom-merida',           'enerkom',     'Mérida',             'YUC'),
  -- Velcen
  ('velcen-escobedo',          'velcen',      'Escobedo',           'NLE')
ON CONFLICT (id) DO UPDATE SET
  ciudad = EXCLUDED.ciudad,
  estado = EXCLUDED.estado;

-- ── RLS PARA NUEVAS TABLAS ──────────────────────────────────
ALTER TABLE segmentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos_segmento ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones ENABLE ROW LEVEL SECURITY;

-- Segmentos: lectura pública para usuarios autenticados
CREATE POLICY "segmentos_read" ON segmentos FOR SELECT
  USING (auth.role() = 'authenticated');

-- Modelos: lectura pública, escritura solo admin/director/regional
CREATE POLICY "modelos_read" ON modelos_segmento FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "modelos_write" ON modelos_segmento FOR ALL
  USING (
    EXISTS (SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND rol IN ('admin', 'regional', 'direccion', 'director'))
  );

-- Sucursales: lectura pública
CREATE POLICY "sucursales_read" ON sucursales FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "sucursales_write" ON sucursales FOR ALL
  USING (
    EXISTS (SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol IN ('admin', 'direccion'))
  );

-- Asignaciones: solo admins
CREATE POLICY "asignaciones_read" ON asignaciones FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "asignaciones_write" ON asignaciones FOR ALL
  USING (
    EXISTS (SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol IN ('admin', 'direccion'))
  );
