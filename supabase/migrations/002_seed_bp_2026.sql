-- ================================================================
-- BP 2026 por distribuidor y modelo
-- ================================================================
INSERT INTO bp_anual (distribuidor_id, anio, modelo, unidades_bp) VALUES
  ('gcm',   2026,'S3',7), ('gcm',   2026,'S5',5), ('gcm',   2026,'S6',3), ('gcm',   2026,'S8',5), ('gcm',   2026,'S12',9),
  ('tang',  2026,'S3',20),('tang',  2026,'S5',15),('tang',  2026,'S6',12),('tang',  2026,'S8',8), ('tang',  2026,'S12',18),
  ('bavi',  2026,'S3',12),('bavi',  2026,'S5',10),('bavi',  2026,'S6',8), ('bavi',  2026,'S8',4), ('bavi',  2026,'S12',6),
  ('astur', 2026,'S3',15),('astur', 2026,'S5',8), ('astur', 2026,'S6',6), ('astur', 2026,'S8',3), ('astur', 2026,'S12',8),
  ('orient',2026,'S3',14),('orient',2026,'S5',10),('orient',2026,'S6',8), ('orient',2026,'S8',5), ('orient',2026,'S12',8),
  ('prem',  2026,'S3',35),('prem',  2026,'S5',24),('prem',  2026,'S6',30),('prem',  2026,'S8',19),('prem',  2026,'S12',26),
  ('pen',   2026,'S3',9), ('pen',   2026,'S5',7), ('pen',   2026,'S6',4), ('pen',   2026,'S8',1), ('pen',   2026,'S12',12),
  ('xian',  2026,'S3',17),('xian',  2026,'S5',14),('xian',  2026,'S6',9), ('xian',  2026,'S8',5), ('xian',  2026,'S12',22)
ON CONFLICT (distribuidor_id, anio, modelo) DO NOTHING;

-- Usuarios con roles
INSERT INTO usuarios (email, nombre, rol) VALUES
  ('israel.esperanza.h@gmail.com', 'Israel Esperanza', 'regional'),
  ('daniel.alcantara@ldrsolutions.com.mx', 'Daniel Alcántara', 'direccion')
ON CONFLICT (email) DO NOTHING;
