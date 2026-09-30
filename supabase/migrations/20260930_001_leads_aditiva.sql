-- Foton OS · Leads de planta → distribuidor → asesor
-- Migración ADITIVA: solo agrega columnas, tablas, funciones y políticas nuevas.
-- No cambia ni retira nada de lo que usan hoy las herramientas publicadas.
-- Las tablas nuevas solo se leen con sesión (no con la clave pública) y se escriben únicamente por funciones.

-- ───────────── Usuarios: datos de contacto y estado ─────────────
alter table public.usuarios
  add column if not exists telefono text,
  add column if not exists whatsapp text,
  add column if not exists activo boolean not null default true,
  add column if not exists recibe_alertas boolean not null default false,
  add column if not exists invitado_por uuid;

-- ───────────── Ayudantes de identidad ─────────────
-- Quién eres: se resuelve por el correo verificado de la sesión. Roles: regional/admin/direccion/director (planta), gerente, asesor.
create or replace function public.fn_yo()
returns public.usuarios language sql stable security definer set search_path = public as $$
  select u.* from public.usuarios u
  where lower(u.email) = lower(coalesce(auth.email(), '')) and u.activo
  limit 1
$$;

create or replace function public.fn_rol()
returns text language sql stable security definer set search_path = public as $$
  select (public.fn_yo()).rol
$$;

create or replace function public.fn_es_planta()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select u.rol in ('regional','admin','direccion','director') from public.fn_yo() u), false)
$$;

create or replace function public.fn_mi_distribuidor()
returns text language sql stable security definer set search_path = public as $$
  select (public.fn_yo()).distribuidor_id
$$;

create or replace function public.fn_mi_id()
returns uuid language sql stable security definer set search_path = public as $$
  select (public.fn_yo()).id
$$;

-- ───────────── Configuración de alertas (editable por planta) ─────────────
create table if not exists public.lead_config (
  clave text primary key,
  valor numeric not null,
  descripcion text not null
);
insert into public.lead_config (clave, valor, descripcion) values
  ('h_asignar_dist',            24, 'Horas que un lead puede estar sin asignar a distribuidor antes de avisar a planta'),
  ('h_asignar_asesor',           4, 'Horas que el gerente tiene para asignar un lead a un asesor'),
  ('h_asignar_asesor_planta',   24, 'Horas sin asignar a asesor para avisar también a planta'),
  ('h_primer_contacto',         24, 'Horas para el primer contacto del asesor (avisa a asesor y gerente)'),
  ('h_primer_contacto_planta',  72, 'Horas sin primer contacto para avisar también a planta'),
  ('d_sin_actualizacion',        3, 'Días sin actualización para avisar al asesor'),
  ('d_sin_actualizacion_ger',    5, 'Días sin actualización para avisar al gerente'),
  ('d_sin_actualizacion_planta', 7, 'Días sin actualización para avisar a planta'),
  ('d_dist_sin_actividad',       5, 'Días sin movimiento en ningún lead de un distribuidor para avisar a planta'),
  ('recordatorios_activos',      1, '1 = repetir el aviso cada día mientras el lead siga sin atenderse; 0 = avisar una sola vez'),
  ('whatsapp_activo',            0, '1 = poner los avisos en la cola de WhatsApp (requiere conectar el proveedor)')
on conflict (clave) do nothing;

create or replace function public.fn_cfg(p_clave text, p_def numeric)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce((select valor from public.lead_config where clave = p_clave), p_def)
$$;

-- ───────────── Leads ─────────────
create sequence if not exists public.lead_folio_seq;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique default ('L-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.lead_folio_seq')::text, 5, '0')),
  origen text not null default 'planta' check (origen in ('planta','web','evento','redes','referido','otro')),
  lote text,
  empresa text,
  contacto text,
  telefono text,
  telefono_norm text,
  correo text,
  estado text,
  ciudad text,
  modelo_interes text,
  cantidad integer,
  notas text,
  distribuidor_id text references public.distribuidores(id),
  asesor_id uuid references public.usuarios(id),
  estatus text not null default 'nuevo' check (estatus in ('nuevo','asignado_dist','asignado_asesor','contactado','cotizacion','negociacion','ganado','perdido','descartado')),
  causa_perdida text,
  recibido_at timestamptz not null default now(),
  asignado_dist_at timestamptz,
  asignado_asesor_at timestamptz,
  primer_contacto_at timestamptz,
  ultima_accion_at timestamptz,
  siguiente_paso text,
  siguiente_paso_fecha date,
  cerrado_at timestamptz,
  pipeline_id uuid references public.pipeline_comercial(id),
  creado_por uuid references public.usuarios(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (empresa is not null or contacto is not null)
);
create index if not exists leads_dist_idx on public.leads (distribuidor_id, estatus);
create index if not exists leads_asesor_idx on public.leads (asesor_id, estatus);
create index if not exists leads_tel_idx on public.leads (telefono_norm) where telefono_norm is not null;
create index if not exists leads_correo_idx on public.leads (lower(correo)) where correo is not null;

create table if not exists public.lead_eventos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  tipo text not null check (tipo in ('creado','asignado_dist','asignado_asesor','reasignado','contacto','nota','estatus','siguiente_paso','liberado')),
  detalle text,
  usuario_id uuid references public.usuarios(id),
  usuario_nombre text,
  created_at timestamptz not null default now()
);
create index if not exists lead_eventos_lead_idx on public.lead_eventos (lead_id, created_at desc);

-- ───────────── Alertas y cola de WhatsApp ─────────────
create table if not exists public.alertas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('sin_asignar_dist','sin_asignar_asesor','sin_contacto','sin_actualizacion','paso_vencido','dist_sin_actividad')),
  nivel text not null default 'aviso' check (nivel in ('aviso','urgente')),
  destino_rol text not null check (destino_rol in ('asesor','gerente','planta')),
  lead_id uuid references public.leads(id) on delete cascade,
  distribuidor_id text references public.distribuidores(id),
  asesor_id uuid references public.usuarios(id),
  mensaje text not null,
  dedupe_key text not null unique,
  creada_at timestamptz not null default now(),
  leida_at timestamptz,
  resuelta_at timestamptz
);
create index if not exists alertas_abiertas_idx on public.alertas (destino_rol, distribuidor_id) where resuelta_at is null;

create table if not exists public.notificaciones_outbox (
  id uuid primary key default gen_random_uuid(),
  alerta_id uuid references public.alertas(id) on delete cascade,
  canal text not null default 'whatsapp' check (canal in ('whatsapp','correo','push')),
  destinatario text not null,
  usuario_id uuid references public.usuarios(id),
  mensaje text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','enviado','error')),
  intentos integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  enviado_at timestamptz
);
create index if not exists outbox_pend_idx on public.notificaciones_outbox (estado) where estado = 'pendiente';

-- ───────────── Seguridad por fila ─────────────
alter table public.lead_config enable row level security;
alter table public.leads enable row level security;
alter table public.lead_eventos enable row level security;
alter table public.alertas enable row level security;
alter table public.notificaciones_outbox enable row level security;

drop policy if exists lead_config_planta on public.lead_config;
create policy lead_config_planta on public.lead_config for select to authenticated using (public.fn_es_planta());

drop policy if exists leads_ver on public.leads;
create policy leads_ver on public.leads for select to authenticated using (
  public.fn_es_planta()
  or (public.fn_rol() = 'gerente' and distribuidor_id = public.fn_mi_distribuidor())
  or (public.fn_rol() = 'asesor' and asesor_id = public.fn_mi_id())
);

drop policy if exists lead_eventos_ver on public.lead_eventos;
create policy lead_eventos_ver on public.lead_eventos for select to authenticated using (
  exists (select 1 from public.leads l where l.id = lead_eventos.lead_id)
);

drop policy if exists alertas_ver on public.alertas;
create policy alertas_ver on public.alertas for select to authenticated using (
  (destino_rol = 'planta' and public.fn_es_planta())
  or (destino_rol = 'gerente' and public.fn_rol() = 'gerente' and distribuidor_id = public.fn_mi_distribuidor())
  or (destino_rol = 'asesor' and public.fn_rol() = 'asesor' and asesor_id = public.fn_mi_id())
);

drop policy if exists outbox_planta on public.notificaciones_outbox;
create policy outbox_planta on public.notificaciones_outbox for select to authenticated using (public.fn_es_planta());

-- Escritura: solo por las funciones de abajo (no hay políticas de insert/update/delete)

-- ───────────── Perfil y equipo ─────────────
create or replace function public.fn_mi_perfil()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when u.id is null then null else jsonb_build_object(
    'id', u.id, 'nombre', u.nombre, 'email', u.email, 'rol', u.rol,
    'planta', public.fn_es_planta(),
    'distribuidor_id', u.distribuidor_id,
    'distribuidor', (select d.nombre from public.distribuidores d where d.id = u.distribuidor_id)
  ) end
  from (select * from public.fn_yo()) u
$$;

create or replace function public.fn_equipo(p_dist text default null)
returns table (id uuid, nombre text, email text, rol text, telefono text, whatsapp text, activo boolean, distribuidor_id text, leads_abiertos bigint)
language plpgsql stable security definer set search_path = public as $$
declare me public.usuarios;
begin
  select * into me from public.fn_yo();
  if me.id is null then raise exception 'sin permiso' using errcode = '42501'; end if;
  if not public.fn_es_planta() then
    if me.rol <> 'gerente' then raise exception 'sin permiso' using errcode = '42501'; end if;
    p_dist := me.distribuidor_id;
  end if;
  return query
    select u.id, u.nombre, u.email, u.rol, u.telefono, u.whatsapp, u.activo, u.distribuidor_id,
           (select count(*) from public.leads l where l.asesor_id = u.id and l.estatus in ('asignado_asesor','contactado','cotizacion','negociacion'))
    from public.usuarios u
    where u.rol in ('asesor','gerente') and (p_dist is null or u.distribuidor_id = p_dist)
    order by u.distribuidor_id, u.rol desc, u.nombre;
end $$;

create or replace function public._alta_usuario(p_rol text, p_nombre text, p_email text, p_telefono text, p_whatsapp text, p_dist text)
returns uuid language plpgsql security definer set search_path = public as $$
declare me public.usuarios; nid uuid; mail text := lower(trim(coalesce(p_email,'')));
begin
  select * into me from public.fn_yo();
  if me.id is null then raise exception 'sin permiso' using errcode = '42501'; end if;
  if p_rol = 'gerente' and not public.fn_es_planta() then raise exception 'solo planta da de alta gerentes' using errcode = '42501'; end if;
  if p_rol = 'asesor' then
    if public.fn_es_planta() then null;
    elsif me.rol = 'gerente' then p_dist := me.distribuidor_id;
    else raise exception 'sin permiso' using errcode = '42501'; end if;
  end if;
  if mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'correo no válido'; end if;
  if coalesce(trim(p_nombre),'') = '' then raise exception 'falta el nombre'; end if;
  if p_dist is null or not exists (select 1 from public.distribuidores where id = p_dist) then raise exception 'distribuidor no válido'; end if;
  if exists (select 1 from public.usuarios where lower(email) = mail) then raise exception 'ese correo ya está dado de alta'; end if;
  insert into public.usuarios (email, nombre, rol, distribuidor_id, telefono, whatsapp, invitado_por)
  values (mail, trim(p_nombre), p_rol, p_dist, nullif(trim(coalesce(p_telefono,'')),''), nullif(trim(coalesce(p_whatsapp,'')),''), me.id)
  returning id into nid;
  return nid;
end $$;

create or replace function public.fn_asesor_alta(p_nombre text, p_email text, p_telefono text default null, p_whatsapp text default null, p_dist text default null)
returns uuid language sql security definer set search_path = public as $$
  select public._alta_usuario('asesor', p_nombre, p_email, p_telefono, p_whatsapp, p_dist)
$$;

create or replace function public.fn_gerente_alta(p_nombre text, p_email text, p_dist text, p_telefono text default null, p_whatsapp text default null)
returns uuid language sql security definer set search_path = public as $$
  select public._alta_usuario('gerente', p_nombre, p_email, p_telefono, p_whatsapp, p_dist)
$$;

-- Baja: el asesor deja de entrar y sus leads abiertos regresan a la bandeja del gerente
create or replace function public.fn_usuario_baja(p_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare me public.usuarios; t public.usuarios; n integer := 0;
begin
  select * into me from public.fn_yo();
  select * into t from public.usuarios where id = p_id;
  if me.id is null or t.id is null then raise exception 'sin permiso' using errcode = '42501'; end if;
  if not public.fn_es_planta() and not (me.rol = 'gerente' and t.rol = 'asesor' and t.distribuidor_id = me.distribuidor_id) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  update public.usuarios set activo = false where id = p_id;
  with liberados as (
    update public.leads set asesor_id = null, estatus = 'asignado_dist', asignado_dist_at = now(), updated_at = now()
    where asesor_id = p_id and estatus in ('asignado_asesor','contactado','cotizacion','negociacion')
    returning id)
  insert into public.lead_eventos (lead_id, tipo, detalle, usuario_id, usuario_nombre)
  select id, 'liberado', 'Asesor dado de baja: regresa a la bandeja del gerente', me.id, me.nombre from liberados;
  get diagnostics n = row_count;
  return n;
end $$;

-- ───────────── Leads: carga, asignación y seguimiento ─────────────
create or replace function public._ev(p_lead uuid, p_tipo text, p_detalle text)
returns void language plpgsql security definer set search_path = public as $$
declare me public.usuarios;
begin
  select * into me from public.fn_yo();
  insert into public.lead_eventos (lead_id, tipo, detalle, usuario_id, usuario_nombre) values (p_lead, p_tipo, p_detalle, me.id, me.nombre);
end $$;

-- Carga (Excel o captura manual): planta manda un arreglo de filas
create or replace function public.fn_lead_importar(p_leads jsonb, p_lote text default null, p_permitir_duplicados boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me public.usuarios; r jsonb; ins integer := 0; dup jsonb := '[]'::jsonb; inv integer := 0;
        tel text; cor text; lid uuid; emp text; con text; org text;
begin
  select * into me from public.fn_yo();
  if me.id is null or not public.fn_es_planta() then raise exception 'sin permiso' using errcode = '42501'; end if;
  if jsonb_typeof(p_leads) <> 'array' then raise exception 'se esperaba una lista de leads'; end if;
  for r in select * from jsonb_array_elements(p_leads) loop
    emp := nullif(trim(coalesce(r->>'empresa','')),'');
    con := nullif(trim(coalesce(r->>'contacto','')),'');
    tel := right(regexp_replace(coalesce(r->>'telefono',''), '\D', '', 'g'), 10);
    if length(tel) < 10 then tel := null; end if;
    cor := nullif(lower(trim(coalesce(r->>'correo',''))),'');
    if (emp is null and con is null) or (tel is null and cor is null) then inv := inv + 1; continue; end if;
    if not p_permitir_duplicados and (
         (tel is not null and exists (select 1 from public.leads where telefono_norm = tel and estatus not in ('perdido','descartado')))
      or (cor is not null and exists (select 1 from public.leads where lower(correo) = cor and estatus not in ('perdido','descartado')))) then
      dup := dup || jsonb_build_array(jsonb_build_object('empresa', emp, 'contacto', con, 'telefono', r->>'telefono', 'correo', cor));
      continue;
    end if;
    org := coalesce(nullif(r->>'origen',''), 'planta');
    if org not in ('planta','web','evento','redes','referido','otro') then org := 'otro'; end if;
    insert into public.leads (origen, lote, empresa, contacto, telefono, telefono_norm, correo, estado, ciudad, modelo_interes, cantidad, notas, creado_por)
    values (org, p_lote, emp, con, nullif(trim(coalesce(r->>'telefono','')),''), tel, cor,
            nullif(trim(coalesce(r->>'estado','')),''), nullif(trim(coalesce(r->>'ciudad','')),''),
            nullif(trim(coalesce(r->>'modelo_interes', r->>'modelo','')),''),
            nullif(regexp_replace(coalesce(r->>'cantidad',''), '\D', '', 'g'),'')::integer,
            nullif(trim(coalesce(r->>'notas','')),''), me.id)
    returning id into lid;
    perform public._ev(lid, 'creado', coalesce('Lote: ' || p_lote, 'Captura manual'));
    ins := ins + 1;
  end loop;
  return jsonb_build_object('insertados', ins, 'duplicados', dup, 'invalidos', inv);
end $$;

-- Planta asigna a mano al distribuidor
create or replace function public.fn_lead_asignar_dist(p_ids uuid[], p_dist text)
returns integer language plpgsql security definer set search_path = public as $$
declare me public.usuarios; n integer := 0; l record;
begin
  select * into me from public.fn_yo();
  if me.id is null or not public.fn_es_planta() then raise exception 'sin permiso' using errcode = '42501'; end if;
  if not exists (select 1 from public.distribuidores where id = p_dist) then raise exception 'distribuidor no válido'; end if;
  for l in select id, distribuidor_id from public.leads where id = any(p_ids) and estatus in ('nuevo','asignado_dist','asignado_asesor') loop
    update public.leads set distribuidor_id = p_dist, asesor_id = null, estatus = 'asignado_dist',
           asignado_dist_at = now(), asignado_asesor_at = null, updated_at = now() where id = l.id;
    perform public._ev(l.id, case when l.distribuidor_id is null then 'asignado_dist' else 'reasignado' end,
                       (select nombre from public.distribuidores where id = p_dist));
    n := n + 1;
  end loop;
  return n;
end $$;

-- El gerente (o planta) asigna al asesor de su distribuidor
create or replace function public.fn_lead_asignar_asesor(p_id uuid, p_asesor uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me public.usuarios; l public.leads; a public.usuarios;
begin
  select * into me from public.fn_yo();
  select * into l from public.leads where id = p_id;
  select * into a from public.usuarios where id = p_asesor and rol = 'asesor' and activo;
  if me.id is null or l.id is null then raise exception 'sin permiso' using errcode = '42501'; end if;
  if a.id is null then raise exception 'asesor no válido'; end if;
  if not public.fn_es_planta() and not (me.rol = 'gerente' and l.distribuidor_id = me.distribuidor_id) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  if a.distribuidor_id is distinct from l.distribuidor_id then raise exception 'el asesor es de otro distribuidor'; end if;
  if l.estatus not in ('asignado_dist','asignado_asesor','contactado','cotizacion','negociacion') then raise exception 'el lead no se puede asignar en su estado actual'; end if;
  update public.leads set asesor_id = p_asesor,
         estatus = case when estatus = 'asignado_dist' then 'asignado_asesor' else estatus end,
         asignado_asesor_at = now(), updated_at = now() where id = p_id;
  perform public._ev(p_id, case when l.asesor_id is null then 'asignado_asesor' else 'reasignado' end, a.nombre);
end $$;

-- Seguimiento: el asesor (o su gerente, o planta) registra un contacto, nota o cambio de estatus
create or replace function public.fn_lead_registrar(
  p_id uuid, p_tipo text default 'nota', p_nota text default null, p_estatus text default null,
  p_siguiente_paso text default null, p_siguiente_fecha date default null, p_causa text default null)
returns void language plpgsql security definer set search_path = public as $$
declare me public.usuarios; l public.leads; cierre boolean;
begin
  select * into me from public.fn_yo();
  select * into l from public.leads where id = p_id;
  if me.id is null or l.id is null then raise exception 'sin permiso' using errcode = '42501'; end if;
  if not (public.fn_es_planta()
       or (me.rol = 'gerente' and l.distribuidor_id = me.distribuidor_id)
       or (me.rol = 'asesor' and l.asesor_id = me.id)) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  if p_tipo not in ('contacto','nota','estatus','siguiente_paso') then raise exception 'tipo no válido'; end if;
  if l.estatus in ('nuevo','asignado_dist') and not public.fn_es_planta() and me.rol = 'asesor' then raise exception 'el lead aún no está asignado'; end if;
  if p_estatus is not null and p_estatus not in ('asignado_asesor','contactado','cotizacion','negociacion','ganado','perdido','descartado') then raise exception 'estatus no válido'; end if;
  if p_estatus = 'perdido' and coalesce(trim(p_causa),'') = '' then raise exception 'indica la causa de pérdida'; end if;
  cierre := p_estatus in ('ganado','perdido','descartado');
  update public.leads set
    estatus = coalesce(p_estatus, case when p_tipo = 'contacto' and estatus = 'asignado_asesor' then 'contactado' else estatus end),
    primer_contacto_at = case when primer_contacto_at is null and (p_tipo = 'contacto' or p_estatus in ('contactado','cotizacion','negociacion','ganado')) then now() else primer_contacto_at end,
    ultima_accion_at = now(),
    siguiente_paso = case when p_siguiente_paso is not null then p_siguiente_paso when cierre then null else siguiente_paso end,
    siguiente_paso_fecha = case when p_siguiente_fecha is not null then p_siguiente_fecha when cierre then null else siguiente_paso_fecha end,
    causa_perdida = case when p_estatus = 'perdido' then p_causa else causa_perdida end,
    cerrado_at = case when cierre then now() else cerrado_at end,
    updated_at = now()
  where id = p_id;
  perform public._ev(p_id, p_tipo, concat_ws(' · ', nullif(p_estatus,''), nullif(p_nota,''), case when p_siguiente_paso is not null then 'Siguiente: ' || p_siguiente_paso end, nullif(p_causa,'')));
end $$;

-- ───────────── Alertas ─────────────
create or replace function public.fn_alerta_leida(p_ids uuid[])
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.alertas a set leida_at = now()
  where a.id = any(p_ids) and a.leida_at is null and (
       (a.destino_rol = 'planta' and public.fn_es_planta())
    or (a.destino_rol = 'gerente' and public.fn_rol() = 'gerente' and a.distribuidor_id = public.fn_mi_distribuidor())
    or (a.destino_rol = 'asesor' and public.fn_rol() = 'asesor' and a.asesor_id = public.fn_mi_id()));
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.fn_lead_config_set(p_clave text, p_valor numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.fn_es_planta() then raise exception 'sin permiso' using errcode = '42501'; end if;
  update public.lead_config set valor = p_valor where clave = p_clave;
  if not found then raise exception 'clave no válida'; end if;
end $$;

-- Cada alerta nueva se pone en la cola de WhatsApp (si planta la activó) para quien corresponda
create or replace function public._alerta_a_outbox()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.fn_cfg('whatsapp_activo', 0) <> 1 then return new; end if;
  insert into public.notificaciones_outbox (alerta_id, canal, destinatario, usuario_id, mensaje)
  select new.id, 'whatsapp', u.whatsapp, u.id, new.mensaje
  from public.usuarios u
  where u.activo and u.whatsapp is not null and (
       (new.destino_rol = 'asesor' and u.id = new.asesor_id)
    or (new.destino_rol = 'gerente' and u.rol = 'gerente' and u.distribuidor_id = new.distribuidor_id)
    or (new.destino_rol = 'planta' and u.recibe_alertas));
  return new;
end $$;

drop trigger if exists alertas_outbox on public.alertas;
create trigger alertas_outbox after insert on public.alertas for each row execute function public._alerta_a_outbox();

-- Genera y resuelve alertas. Se ejecuta cada 15 minutos (pg_cron) o a mano.
create or replace function public.fn_alertas_generar()
returns jsonb language plpgsql security definer set search_path = public as $$
declare b text; nuevas integer := 0; n integer; resueltas integer := 0;
begin
  b := case when public.fn_cfg('recordatorios_activos', 1) = 1 then to_char(current_date, 'YYYYMMDD') else 'u' end;

  -- Resolver: el lead cambió de estado o tuvo movimiento después de la alerta
  update public.alertas a set resuelta_at = now()
  from public.leads l
  where a.lead_id = l.id and a.resuelta_at is null and (
       (a.tipo = 'sin_asignar_dist'   and l.estatus <> 'nuevo')
    or (a.tipo = 'sin_asignar_asesor' and l.estatus <> 'asignado_dist')
    or (a.tipo = 'sin_contacto'       and l.estatus <> 'asignado_asesor')
    or (a.tipo in ('sin_actualizacion','paso_vencido') and l.estatus not in ('asignado_asesor','contactado','cotizacion','negociacion'))
    or (a.tipo in ('sin_contacto','sin_actualizacion','paso_vencido') and l.ultima_accion_at > a.creada_at and
        (a.tipo <> 'paso_vencido' or l.siguiente_paso_fecha is null or l.siguiente_paso_fecha >= current_date)));
  get diagnostics resueltas = row_count;
  update public.alertas a set resuelta_at = now()
  where a.tipo = 'dist_sin_actividad' and a.resuelta_at is null and exists (
    select 1 from public.leads l where l.distribuidor_id = a.distribuidor_id and l.ultima_accion_at > a.creada_at);

  -- Planta: lead sin asignar a distribuidor
  insert into public.alertas (tipo, nivel, destino_rol, lead_id, mensaje, dedupe_key)
  select 'sin_asignar_dist', 'aviso', 'planta', l.id,
         'Lead ' || l.folio || ' (' || coalesce(l.empresa, l.contacto) || ') lleva ' || floor(extract(epoch from now() - l.recibido_at) / 3600) || ' h sin asignar a distribuidor',
         'sad:' || l.id || ':' || b
  from public.leads l
  where l.estatus = 'nuevo' and l.recibido_at < now() - public.fn_cfg('h_asignar_dist', 24) * interval '1 hour'
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count; nuevas := nuevas + n;

  -- Gerente: lead sin asignar a asesor (y planta si se alarga)
  insert into public.alertas (tipo, nivel, destino_rol, lead_id, distribuidor_id, mensaje, dedupe_key)
  select 'sin_asignar_asesor', 'aviso', 'gerente', l.id, l.distribuidor_id,
         'Asigna un asesor al lead ' || l.folio || ' (' || coalesce(l.empresa, l.contacto) || '): ' || floor(extract(epoch from now() - l.asignado_dist_at) / 3600) || ' h en tu bandeja',
         'saa-g:' || l.id || ':' || b
  from public.leads l
  where l.estatus = 'asignado_dist' and l.asignado_dist_at < now() - public.fn_cfg('h_asignar_asesor', 4) * interval '1 hour'
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count; nuevas := nuevas + n;
  insert into public.alertas (tipo, nivel, destino_rol, lead_id, distribuidor_id, mensaje, dedupe_key)
  select 'sin_asignar_asesor', 'urgente', 'planta', l.id, l.distribuidor_id,
         (select d.nombre from public.distribuidores d where d.id = l.distribuidor_id) || ' no asigna asesor al lead ' || l.folio || ' desde hace ' || floor(extract(epoch from now() - l.asignado_dist_at) / 3600) || ' h',
         'saa-p:' || l.id || ':' || b
  from public.leads l
  where l.estatus = 'asignado_dist' and l.asignado_dist_at < now() - public.fn_cfg('h_asignar_asesor_planta', 24) * interval '1 hour'
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count; nuevas := nuevas + n;

  -- Asesor y gerente: sin primer contacto (y planta si se alarga)
  insert into public.alertas (tipo, nivel, destino_rol, lead_id, distribuidor_id, asesor_id, mensaje, dedupe_key)
  select 'sin_contacto', 'aviso', r.rol, l.id, l.distribuidor_id, l.asesor_id,
         case r.rol when 'asesor' then 'Contacta al lead ' else 'Tu asesor no ha contactado al lead ' end || l.folio || ' (' || coalesce(l.empresa, l.contacto) || '): ' || floor(extract(epoch from now() - l.asignado_asesor_at) / 3600) || ' h sin contacto',
         'sc-' || r.rol || ':' || l.id || ':' || b
  from public.leads l, (values ('asesor'), ('gerente')) r(rol)
  where l.estatus = 'asignado_asesor' and l.asignado_asesor_at < now() - public.fn_cfg('h_primer_contacto', 24) * interval '1 hour'
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count; nuevas := nuevas + n;
  insert into public.alertas (tipo, nivel, destino_rol, lead_id, distribuidor_id, asesor_id, mensaje, dedupe_key)
  select 'sin_contacto', 'urgente', 'planta', l.id, l.distribuidor_id, l.asesor_id,
         'Lead ' || l.folio || ' de ' || (select d.nombre from public.distribuidores d where d.id = l.distribuidor_id) || ' sin primer contacto en ' || floor(extract(epoch from now() - l.asignado_asesor_at) / 3600) || ' h',
         'sc-p:' || l.id || ':' || b
  from public.leads l
  where l.estatus = 'asignado_asesor' and l.asignado_asesor_at < now() - public.fn_cfg('h_primer_contacto_planta', 72) * interval '1 hour'
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count; nuevas := nuevas + n;

  -- Sin actualización: asesor, gerente y planta según los días
  insert into public.alertas (tipo, nivel, destino_rol, lead_id, distribuidor_id, asesor_id, mensaje, dedupe_key)
  select 'sin_actualizacion', case r.rol when 'planta' then 'urgente' else 'aviso' end, r.rol, l.id, l.distribuidor_id, l.asesor_id,
         'Lead ' || l.folio || ' (' || coalesce(l.empresa, l.contacto) || ') sin actualización desde hace ' || floor(extract(epoch from now() - coalesce(l.ultima_accion_at, l.asignado_asesor_at)) / 86400) || ' días',
         'su-' || r.rol || ':' || l.id || ':' || b
  from public.leads l
  join (values ('asesor','d_sin_actualizacion',3), ('gerente','d_sin_actualizacion_ger',5), ('planta','d_sin_actualizacion_planta',7)) r(rol, clave, def) on true
  where l.estatus in ('asignado_asesor','contactado','cotizacion','negociacion')
    and coalesce(l.ultima_accion_at, l.asignado_asesor_at) < now() - public.fn_cfg(r.clave, r.def) * interval '1 day'
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count; nuevas := nuevas + n;

  -- Siguiente paso vencido: asesor y gerente
  insert into public.alertas (tipo, nivel, destino_rol, lead_id, distribuidor_id, asesor_id, mensaje, dedupe_key)
  select 'paso_vencido', 'aviso', r.rol, l.id, l.distribuidor_id, l.asesor_id,
         'Siguiente paso vencido en el lead ' || l.folio || ' (' || coalesce(l.empresa, l.contacto) || '): ' || coalesce(l.siguiente_paso, 'dar seguimiento') || ' (' || to_char(l.siguiente_paso_fecha, 'DD/MM') || ')',
         'pv-' || r.rol || ':' || l.id || ':' || b
  from public.leads l, (values ('asesor'), ('gerente')) r(rol)
  where l.estatus in ('asignado_asesor','contactado','cotizacion','negociacion') and l.siguiente_paso_fecha < current_date
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count; nuevas := nuevas + n;

  -- Planta: distribuidor sin ningún movimiento en sus leads
  insert into public.alertas (tipo, nivel, destino_rol, distribuidor_id, mensaje, dedupe_key)
  select 'dist_sin_actividad', 'urgente', 'planta', d.id,
         d.nombre || ' no ha movido sus leads en ' || floor(extract(epoch from now() - x.ult) / 86400) || ' días (' || x.abiertos || ' abiertos)',
         'dsa:' || d.id || ':' || b
  from public.distribuidores d
  join (select distribuidor_id, count(*) abiertos, max(coalesce(ultima_accion_at, asignado_asesor_at, asignado_dist_at)) ult
        from public.leads where estatus in ('asignado_dist','asignado_asesor','contactado','cotizacion','negociacion') group by 1) x on x.distribuidor_id = d.id
  where x.ult < now() - public.fn_cfg('d_dist_sin_actividad', 5) * interval '1 day'
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count; nuevas := nuevas + n;

  return jsonb_build_object('nuevas', nuevas, 'resueltas', resueltas);
end $$;

-- ───────────── Tablero de planta ─────────────
create or replace function public.fn_leads_tablero()
returns table (distribuidor_id text, distribuidor text, region text, total bigint, sin_asesor bigint, sin_contacto bigint, en_proceso bigint, ganados bigint, perdidos bigint, vencidos bigint, horas_primer_contacto numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.fn_es_planta() then raise exception 'sin permiso' using errcode = '42501'; end if;
  return query
  select d.id, d.nombre, d.region,
         count(l.id),
         count(*) filter (where l.estatus = 'asignado_dist'),
         count(*) filter (where l.estatus = 'asignado_asesor'),
         count(*) filter (where l.estatus in ('contactado','cotizacion','negociacion')),
         count(*) filter (where l.estatus = 'ganado'),
         count(*) filter (where l.estatus = 'perdido'),
         count(*) filter (where l.estatus in ('asignado_asesor','contactado','cotizacion','negociacion') and l.siguiente_paso_fecha < current_date),
         round(avg(extract(epoch from l.primer_contacto_at - l.asignado_dist_at) / 3600)::numeric, 1)
  from public.distribuidores d
  join public.leads l on l.distribuidor_id = d.id
  group by d.id, d.nombre, d.region
  order by count(*) filter (where l.estatus = 'asignado_dist') desc, d.nombre;
end $$;

-- ───────────── Permisos de ejecución ─────────────
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and (p.proname like 'fn\_lead%' or p.proname like 'fn\_alerta%' or p.proname in
             ('fn_yo','fn_rol','fn_es_planta','fn_mi_distribuidor','fn_mi_id','fn_cfg','fn_mi_perfil','fn_equipo','fn_asesor_alta','fn_gerente_alta','fn_usuario_baja','fn_alertas_generar','fn_leads_tablero','_ev','_alta_usuario','_alerta_a_outbox'))
  loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
revoke all on public.lead_config, public.leads, public.lead_eventos, public.alertas, public.notificaciones_outbox from anon;
grant select on public.lead_config, public.leads, public.lead_eventos, public.alertas, public.notificaciones_outbox to authenticated;
