-- Foton OS · Seguridad fase 2A (no rompe ningún portal publicado)
-- 1) Cierra funciones destructivas que cualquiera con la llave pública podía ejecutar.
-- 2) Quita a `anon` permisos de tabla que nunca usa (las políticas RLS ya lo impedían; esto es defensa en profundidad).
-- No toca lecturas anónimas ni las tablas que los portales actuales escriben como anónimo (examenes, examenes_detalle, retail_clientes, inventario_unidades): eso es la fase 2B.

-- 1) Funciones: solo service_role (cargas desde scripts con llave de servicio)
revoke execute on function public.truncate_back_order()               from public, anon, authenticated;
revoke execute on function public.truncate_back_order_segmento(text)  from public, anon, authenticated;
revoke execute on function public.fn_reset_contactos_semana()         from public, anon, authenticated;
grant  execute on function public.truncate_back_order()               to service_role;
grant  execute on function public.truncate_back_order_segmento(text)  to service_role;
grant  execute on function public.fn_reset_contactos_semana()         to service_role;

-- 2) Tablas: anon no escribe ni altera estructura en tablas de negocio de solo lectura
do $$
declare t text;
begin
  foreach t in array array['asignaciones','back_order','bp_anual','cobranza_2026','distribuidores','facturado_ytd','inventario_legacy',
    'modelos_segmento','pipeline_comercial','segmentos','sucursales','usuarios','vendedores_especialistas',
    'visita_acuerdos','visita_agenda','visita_fotos','visita_pipeline','visitas']
  loop
    execute format('revoke insert, update, delete, truncate, references, trigger on public.%I from anon', t);
  end loop;
  -- tablas que los portales escriben como anónimo: solo se quita lo estructural
  foreach t in array array['examenes','examenes_detalle','retail_clientes','inventario_unidades']
  loop
    execute format('revoke delete, truncate, references, trigger on public.%I from anon', t);
  end loop;
end $$;
