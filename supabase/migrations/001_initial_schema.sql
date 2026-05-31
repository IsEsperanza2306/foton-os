-- ================================================================
-- Foton México GR Centro-Sur — Schema inicial
-- Proyecto: foton-app
-- ================================================================

-- 1. Usuarios / Regionales
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  nombre text not null,
  rol text not null default 'regional', -- 'admin' | 'regional'
  region text,
  created_at timestamptz default now()
);

-- 2. Distribuidores
create table if not exists distribuidores (
  id text primary key, -- 'gcm', 'tang', 'bavi', etc.
  nombre text not null,
  plaza text not null,
  grupo text,
  contacto text,
  segmento text default 'MDT/LDT',
  status text default 'activo', -- 'activo' | 'nuevo' | 'riesgo' | 'seguimiento'
  regional_id uuid references usuarios(id),
  created_at timestamptz default now()
);

-- 3. Business Plan anual por modelo
create table if not exists bp_anual (
  id uuid primary key default gen_random_uuid(),
  distribuidor_id text references distribuidores(id),
  anio int not null,
  modelo text not null, -- 'S3' | 'S5' | 'S6' | 'S8' | 'S12'
  unidades_bp int default 0,
  monto_bp numeric default 0,
  unique(distribuidor_id, anio, modelo)
);

-- 4. Facturado YTD (se actualiza mensualmente)
create table if not exists facturado_ytd (
  id uuid primary key default gen_random_uuid(),
  distribuidor_id text references distribuidores(id),
  anio int not null,
  mes int not null, -- 1-12
  modelo text not null,
  unidades_facturadas int default 0,
  updated_at timestamptz default now(),
  updated_by uuid references usuarios(id),
  unique(distribuidor_id, anio, mes, modelo)
);

-- 5. Visitas / Minutas
create table if not exists visitas (
  id uuid primary key default gen_random_uuid(),
  distribuidor_id text references distribuidores(id),
  fecha date not null,
  hora time,
  tipo_visita text[], -- ['Operativa', 'Capacitacion', etc.]
  regional text,
  participantes text[],
  logros text,
  comentarios text,
  status text default 'borrador', -- 'borrador' | 'completada' | 'firmada'
  pdf_path text,
  created_at timestamptz default now(),
  created_by uuid references usuarios(id)
);

-- 6. Agenda items por visita
create table if not exists visita_agenda (
  id uuid primary key default gen_random_uuid(),
  visita_id uuid references visitas(id) on delete cascade,
  item_id text not null, -- 'precios', 'leads', 'g_indicadores', etc.
  seccion text not null, -- 'ops' | 'gerencial'
  done boolean default false,
  comentario text,
  datos jsonb, -- campos específicos del item
  created_at timestamptz default now()
);

-- 7. Pipeline / Prospectos por visita
create table if not exists visita_pipeline (
  id uuid primary key default gen_random_uuid(),
  visita_id uuid references visitas(id) on delete cascade,
  cliente text,
  modelo text,
  avance text,
  comentario text
);

-- 8. Acuerdos por visita
create table if not exists visita_acuerdos (
  id uuid primary key default gen_random_uuid(),
  visita_id uuid references visitas(id) on delete cascade,
  numero int,
  texto text not null,
  responsable text,
  fecha_compromiso text,
  cumplido boolean default false
);

-- 9. Fotos por visita (paths a Supabase Storage)
create table if not exists visita_fotos (
  id uuid primary key default gen_random_uuid(),
  visita_id uuid references visitas(id) on delete cascade,
  agenda_item_id text,
  storage_path text not null,
  created_at timestamptz default now()
);

-- ================================================================
-- Datos iniciales: Distribuidores Centro-Sur 2026
-- ================================================================
insert into distribuidores (id, nombre, plaza, grupo, contacto, status) values
  ('gcm',    'Grupo Carrocero Milenio',         'Tula',           'GCM',        'Karla Santillan', 'nuevo'),
  ('tang',   'Autos Y Camiones Asia Central',   'San Luis Potosi','Tangamanga', 'Erick Elizalde',  'activo'),
  ('bavi',   'Burk Automotriz',                 'Uruapan',        'BAVI',       'Samir Daud',      'activo'),
  ('astur',  'Autos Emcg',                      'Puebla',         'Asturcar',   null,              'riesgo'),
  ('orient', 'Camiones Orientales De Leon',     'Leon',           'Plascencia', null,              'activo'),
  ('prem',   'Camiones Premium Del Centro',     'Queretaro',      'Premium',    null,              'seguimiento'),
  ('pen',    'Vehiculos Comerciales Peninsula', 'Cancun / Merida','Enerkom',    null,              'seguimiento'),
  ('xian',   'Xian Motors',                     'Guadalajara',    'Xian',       null,              'seguimiento')
on conflict (id) do nothing;
