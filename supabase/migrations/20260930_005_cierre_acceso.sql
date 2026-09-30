-- Foton OS · Cierre de acceso (Fase 2B)
-- APLICAR SOLO DESPUÉS de publicar la rama `leads` y de dar de alta a los gerentes (las páginas publicadas hoy dejarían de ver datos).
-- Requiere las migraciones 003 y 004.

-- 1) El PIN deja de ser legible desde la llave pública y desde cualquier sesión (solo lo entregan las funciones)
revoke select on public.distribuidores from anon, authenticated;
do $$
declare cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into cols
  from information_schema.columns where table_schema = 'public' and table_name = 'distribuidores' and column_name <> 'pin';
  execute 'grant select (' || cols || ') on public.distribuidores to anon, authenticated';
end $$;

-- 2) Datos de negocio: fuera de la lectura anónima (los leen las sesiones con correo, acotadas por región o distribuidor)
drop policy if exists anon_read_cobranza  on public.cobranza_2026;
drop policy if exists anon_read_facturado on public.facturado_ytd;
drop policy if exists anon_read_bp        on public.bp_anual;
drop policy if exists anon_read_pipeline  on public.pipeline_comercial;
revoke select on public.cobranza_2026, public.facturado_ytd, public.bp_anual, public.pipeline_comercial,
  public.inventario_legacy, public.asignaciones, public.v_panel_seguimiento from anon;

-- 3) Inventario y clientes retail: solo con sesión y dentro de tu distribuidor / región
drop policy if exists inventario_insert_all on public.inventario_unidades;
drop policy if exists inventario_select_all on public.inventario_unidades;
drop policy if exists inventario_update_all on public.inventario_unidades;
create policy inv_ver   on public.inventario_unidades for select to authenticated using (public.fn_ve_dist(distribuidor_id));
create policy inv_crea  on public.inventario_unidades for insert to authenticated
  with check (public.fn_ve_dist(distribuidor_id) and (select u.rol <> 'asesor' from public.fn_yo() u));
create policy inv_edita on public.inventario_unidades for update to authenticated
  using (public.fn_ve_dist(distribuidor_id) and (select u.rol <> 'asesor' from public.fn_yo() u));
drop policy if exists retail_insert_all on public.retail_clientes;
drop policy if exists retail_select_all on public.retail_clientes;
create policy retail_ver  on public.retail_clientes for select to authenticated using (public.fn_ve_dist(distribuidor_id));
create policy retail_crea on public.retail_clientes for insert to authenticated
  with check (public.fn_ve_dist(distribuidor_id) and (select u.rol <> 'asesor' from public.fn_yo() u));
revoke all on public.inventario_unidades, public.retail_clientes from anon;

-- 4) Exámenes: cualquiera puede presentarlo (insertar); el detalle de respuestas solo lo lee planta
drop policy if exists anon_all_examenes on public.examenes;
drop policy if exists anon_all_detalle  on public.examenes_detalle;
create policy examen_inserta on public.examenes for insert to anon, authenticated with check (true);
create policy examen_ranking on public.examenes for select to anon, authenticated using (true);
create policy detalle_inserta on public.examenes_detalle for insert to anon, authenticated with check (true);
create policy detalle_planta  on public.examenes_detalle for select to authenticated
  using ((select u.rol in ('admin', 'regional', 'direccion', 'director') from public.fn_yo() u));
revoke update, delete on public.examenes, public.examenes_detalle from anon, authenticated;
revoke select on public.examenes_detalle from anon;
grant select on public.examenes_detalle to authenticated;
