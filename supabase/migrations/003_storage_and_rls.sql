-- Storage bucket for visita photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('visita-fotos', 'visita-fotos', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE usuarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribuidores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bp_anual          ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturado_ytd     ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE visita_agenda     ENABLE ROW LEVEL SECURITY;
ALTER TABLE visita_acuerdos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE visita_fotos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE visita_pipeline   ENABLE ROW LEVEL SECURITY;

-- Read: authenticated users can read everything
CREATE POLICY "read_all" ON usuarios          FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON distribuidores    FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON bp_anual          FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON facturado_ytd     FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON visitas           FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON visita_agenda     FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON visita_acuerdos   FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON visita_fotos      FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_all" ON visita_pipeline   FOR SELECT TO authenticated USING (true);

-- Helper: check if current user has regional role
CREATE OR REPLACE FUNCTION is_regional()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios
    WHERE email = auth.email() AND rol = 'regional'
  );
$$;

-- Write: only regional role can modify data
CREATE POLICY "write_regional" ON bp_anual        FOR ALL TO authenticated USING (is_regional()) WITH CHECK (is_regional());
CREATE POLICY "write_regional" ON facturado_ytd   FOR ALL TO authenticated USING (is_regional()) WITH CHECK (is_regional());
CREATE POLICY "insert_regional" ON visitas        FOR INSERT TO authenticated WITH CHECK (is_regional());
CREATE POLICY "update_regional" ON visitas        FOR UPDATE TO authenticated USING (is_regional());
CREATE POLICY "write_regional" ON visita_agenda   FOR ALL TO authenticated USING (is_regional()) WITH CHECK (is_regional());
CREATE POLICY "write_regional" ON visita_acuerdos FOR ALL TO authenticated USING (is_regional()) WITH CHECK (is_regional());
CREATE POLICY "write_regional" ON visita_fotos    FOR ALL TO authenticated USING (is_regional()) WITH CHECK (is_regional());
CREATE POLICY "write_regional" ON visita_pipeline FOR ALL TO authenticated USING (is_regional()) WITH CHECK (is_regional());

-- Storage policies for visita-fotos bucket
CREATE POLICY "upload_visita_fotos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'visita-fotos' AND is_regional());

CREATE POLICY "read_visita_fotos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'visita-fotos');
