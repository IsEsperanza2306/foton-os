-- ================================================================
-- Migration 004: Dealer Portal — inventario, back_order, dealer role
-- ================================================================

-- 1. Add distribuidor_id to usuarios (links a dealer user to their dealership)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS distribuidor_id text references distribuidores(id);

-- 2. Update rol constraint comment (add 'dealer' as valid value)
-- rol values: 'admin' | 'regional' | 'direccion' | 'dealer'

-- 3. Inventario por dealer (snapshot mensual actualizable)
CREATE TABLE IF NOT EXISTS inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distribuidor_id text NOT NULL REFERENCES distribuidores(id),
  modelo text NOT NULL,           -- 'S3'|'S5'|'S6'|'S8'|'S12'
  unidades_fisicas int DEFAULT 0,      -- physically on the lot
  unidades_facturadas int DEFAULT 0,   -- billed by Foton to dealer (wholesale in)
  unidades_comprometidas int DEFAULT 0, -- promised to customers
  unidades_retail int DEFAULT 0,       -- sold & delivered this month
  anio int NOT NULL,
  mes int NOT NULL,
  notas text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES usuarios(id),
  UNIQUE(distribuidor_id, modelo, anio, mes)
);

-- 4. Back order (units in pipeline from Foton to dealer)
CREATE TABLE IF NOT EXISTS back_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distribuidor_id text NOT NULL REFERENCES distribuidores(id),
  modelo text NOT NULL,
  unidades int DEFAULT 0,
  status text DEFAULT 'confirmado', -- 'confirmado'|'produccion'|'transito'|'entregado'
  eta date,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES usuarios(id)
);

-- 5. RLS: Dealers can only read/write their own distribuidor's data
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE back_order ENABLE ROW LEVEL SECURITY;

-- Inventario: dealer reads/writes own, plant reads all
CREATE POLICY "dealer_inventario_own" ON inventario
  FOR ALL USING (
    distribuidor_id IN (
      SELECT distribuidor_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "plant_inventario_all" ON inventario
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin','regional','direccion'))
  );

CREATE POLICY "plant_inventario_write" ON inventario
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin','regional'))
  );

-- Back order: dealer reads own, plant reads/writes all
CREATE POLICY "dealer_backorder_read" ON back_order
  FOR SELECT USING (
    distribuidor_id IN (
      SELECT distribuidor_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "plant_backorder_all" ON back_order
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin','regional','direccion'))
  );
