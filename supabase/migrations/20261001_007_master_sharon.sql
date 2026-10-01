-- Sharon Caraveo es master (igual que Israel): alta en usuarios como regional sin región (ve todo)
-- y en la lista de master de fn_pin_inventario. En el sitio, también en MASTER de _acceso.js y login.html.
insert into public.usuarios (email, nombre, rol, region, segmento_id, activo, recibe_alertas)
values ('sharon.caraveo@ldrsolutions.com.mx', 'Sharon Caraveo', 'regional', null, 'mdt', true, false)
on conflict do nothing;

create or replace function public.fn_pin_inventario()
returns text language plpgsql stable security definer set search_path = public as $$
declare me public.usuarios;
begin
  select * into me from public.fn_yo();
  if me.id is null or not (me.rol in ('direccion', 'director', 'admin')
     or lower(me.email) in ('israel.esperanza.h@gmail.com', 'israel.esperanza@ldrsolutions.com.mx', 'sharon.caraveo@ldrsolutions.com.mx')) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  return (select valor from public.claves_herramienta where clave = 'inventario');
end $$;
