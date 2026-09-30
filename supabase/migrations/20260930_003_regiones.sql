-- Foton OS · Separación por región (Gerente Regional)
-- Cada regional ve solo los distribuidores de su región. Un regional sin región asignada ve todo (master y pruebas).
-- Gerente y asesor ven solo su distribuidor. Admin, dirección y director ven todo.
-- Aplica a las sesiones con correo (authenticated). La lectura anónima se cierra en la migración 004.

alter table public.usuarios add column if not exists region text;
update public.usuarios set region = 'marco'   where lower(email) = 'marco.chagoya@ldrsolutions.com.mx'  and region is null;
update public.usuarios set region = 'rodrigo' where lower(email) = 'rodrigo.garcia@ldrsolutions.com.mx' and region is null;

-- ¿El usuario de la sesión puede ver datos de este distribuidor?
create or replace function public.fn_ve_dist(p_dist text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select case
      when u.rol in ('admin', 'direccion', 'director') then true
      when u.rol = 'regional' then u.region is null
        or exists (select 1 from public.distribuidores d where d.id = p_dist and d.region = u.region)
      when u.rol in ('gerente', 'asesor') then u.distribuidor_id is not distinct from p_dist
      else false end
    from public.fn_yo() u), false)
$$;

create or replace function public.fn_ve_visita(p_visita anyelement)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.visitas v where v.id = p_visita and public.fn_ve_dist(v.distribuidor_id))
$$;

create or replace function public.fn_es_regional()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select u.rol = 'regional' from public.fn_yo() u), false)
$$;

revoke all on function public.fn_ve_dist(text), public.fn_ve_visita(anyelement), public.fn_es_regional() from public, anon;
grant execute on function public.fn_ve_dist(text), public.fn_ve_visita(anyelement), public.fn_es_regional() to authenticated;

-- Tablas con distribuidor_id: lectura acotada; escritura del regional solo dentro de su región
do $$
declare t text;
begin
  foreach t in array array['bp_anual', 'facturado_ytd', 'vendedores_especialistas'] loop
    execute format('drop policy if exists read_all on public.%I', t);
    execute format('drop policy if exists write_regional on public.%I', t);
    execute format('create policy ver_por_region on public.%I for select to authenticated using (public.fn_ve_dist(distribuidor_id))', t);
    execute format('create policy escribe_regional on public.%I for all to authenticated using (public.fn_es_regional() and public.fn_ve_dist(distribuidor_id)) with check (public.fn_es_regional() and public.fn_ve_dist(distribuidor_id))', t);
  end loop;
  foreach t in array array['cobranza_2026', 'pipeline_comercial'] loop
    execute format('drop policy if exists ver_por_region on public.%I', t);
    execute format('create policy ver_por_region on public.%I for select to authenticated using (public.fn_ve_dist(distribuidor_id))', t);
  end loop;
end $$;

-- Distribuidores
drop policy if exists read_all on public.distribuidores;
create policy ver_por_region on public.distribuidores for select to authenticated using (public.fn_ve_dist(id));

-- Back order: quita el acceso total de planta y lo acota
drop policy if exists plant_backorder_all on public.back_order;
drop policy if exists dealer_backorder_read on public.back_order;
create policy ver_por_region on public.back_order for select to authenticated using (public.fn_ve_dist(distribuidor_id));
create policy escribe_planta on public.back_order for all to authenticated
  using (public.fn_ve_dist(distribuidor_id) and (select u.rol in ('admin', 'regional', 'direccion') from public.fn_yo() u))
  with check (public.fn_ve_dist(distribuidor_id) and (select u.rol in ('admin', 'regional', 'direccion') from public.fn_yo() u));

-- Visitas y sus detalles
drop policy if exists read_all on public.visitas;
drop policy if exists insert_regional on public.visitas;
drop policy if exists update_regional on public.visitas;
create policy ver_por_region on public.visitas for select to authenticated using (public.fn_ve_dist(distribuidor_id));
create policy crea_regional on public.visitas for insert to authenticated with check (public.fn_es_regional() and public.fn_ve_dist(distribuidor_id));
create policy edita_regional on public.visitas for update to authenticated using (public.fn_es_regional() and public.fn_ve_dist(distribuidor_id));
do $$
declare t text;
begin
  foreach t in array array['visita_acuerdos', 'visita_agenda', 'visita_fotos', 'visita_pipeline'] loop
    execute format('drop policy if exists read_all on public.%I', t);
    execute format('drop policy if exists write_regional on public.%I', t);
    execute format('create policy ver_por_region on public.%I for select to authenticated using (public.fn_ve_visita(visita_id))', t);
    execute format('create policy escribe_regional on public.%I for all to authenticated using (public.fn_es_regional() and public.fn_ve_visita(visita_id)) with check (public.fn_es_regional() and public.fn_ve_visita(visita_id))', t);
  end loop;
end $$;

-- Usuarios: cada quien ve su fila; admin, dirección y director ven todas (el equipo se consulta con fn_equipo)
drop policy if exists read_all on public.usuarios;
create policy ver_propio on public.usuarios for select to authenticated
  using (lower(email) = lower(coalesce(auth.email(), '')) or (select u.rol in ('admin', 'direccion', 'director') from public.fn_yo() u));

-- La vista de seguimiento corre con los permisos de quien la consulta
alter view public.v_panel_seguimiento set (security_invoker = true);
