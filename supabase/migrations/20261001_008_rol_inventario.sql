-- Rol 'inventario': solo Control de inventario (en el sitio, SOLO de _acceso.js). No es planta, así que la base no le abre otros datos.
create or replace function public.fn_pin_inventario()
returns text language plpgsql stable security definer set search_path = public as $$
declare me public.usuarios;
begin
  select * into me from public.fn_yo();
  if me.id is null or not (me.rol in ('direccion', 'director', 'admin', 'inventario')
     or lower(me.email) in ('israel.esperanza.h@gmail.com', 'israel.esperanza@ldrsolutions.com.mx', 'sharon.caraveo@ldrsolutions.com.mx')) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  return (select valor from public.claves_herramienta where clave = 'inventario');
end $$;

insert into public.usuarios (email, nombre, rol, region, segmento_id, activo, recibe_alertas)
values ('miguel.vallejo@ldrsolutions.com.mx', 'Miguel Vallejo', 'inventario', null, 'mdt', true, false)
on conflict (email) do nothing;
