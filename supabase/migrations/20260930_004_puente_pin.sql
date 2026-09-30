-- Foton OS · Puente de PIN: entrar a Dealer y Asesor con correo, sin teclear el PIN
-- Requiere la migración 003 (fn_ve_dist). Segura de aplicar en cualquier momento.

-- El PIN del distribuidor solo se entrega a quien tiene derecho a ese distribuidor:
-- gerente y asesor reciben el de su distribuidor; planta y master el del distribuidor que elijan (dentro de su región).
create or replace function public.fn_pin_acceso(p_dist text default null)
returns text language plpgsql stable security definer set search_path = public as $$
declare me public.usuarios; d text;
begin
  select * into me from public.fn_yo();
  if me.id is null then raise exception 'sin permiso' using errcode = '42501'; end if;
  d := case when me.rol in ('gerente', 'asesor') then me.distribuidor_id else p_dist end;
  if d is null or not public.fn_ve_dist(d) then raise exception 'sin permiso' using errcode = '42501'; end if;
  return (select pin from public.distribuidores where id = d);
end $$;
revoke all on function public.fn_pin_acceso(text) from public, anon;
grant execute on function public.fn_pin_acceso(text) to authenticated;

-- Validar un PIN sin leer la tabla (así la columna pin se puede ocultar). Agrega la región al resultado.
create or replace function public.fn_validar_pin(p_pin text)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_row distribuidores%rowtype;
begin
  select * into v_row from distribuidores where pin = p_pin and p_pin is not null and p_pin <> '';
  if not found then return null; end if;
  return json_build_object('id', v_row.id, 'nombre', v_row.nombre, 'plaza', v_row.plaza, 'region', v_row.region);
end $$;
