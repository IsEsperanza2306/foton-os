-- Foton OS · Inventario sin PIN para el equipo interno
-- El inventario publicado viene cifrado con su PIN. El PIN se guarda aquí (tabla sin acceso directo)
-- y solo se entrega por RPC a Dirección, Administración y master, igual que la regla de _acceso.js.
create table if not exists public.claves_herramienta (
  clave text primary key,
  valor text not null,
  actualizado timestamptz not null default now()
);
alter table public.claves_herramienta enable row level security;
revoke all on public.claves_herramienta from public, anon, authenticated;

create or replace function public.fn_pin_inventario()
returns text language plpgsql stable security definer set search_path = public as $$
declare me public.usuarios;
begin
  select * into me from public.fn_yo();
  if me.id is null or not (me.rol in ('direccion', 'director', 'admin')
     or lower(me.email) in ('israel.esperanza.h@gmail.com', 'israel.esperanza@ldrsolutions.com.mx')) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  return (select valor from public.claves_herramienta where clave = 'inventario');
end $$;
revoke all on function public.fn_pin_inventario() from public, anon;
grant execute on function public.fn_pin_inventario() to authenticated;

-- Para activarlo, en el SQL Editor de Supabase (el PIN no se escribe en este archivo):
--   insert into public.claves_herramienta (clave, valor) values ('inventario', 'TU_PIN')
--   on conflict (clave) do update set valor = excluded.valor, actualizado = now();
