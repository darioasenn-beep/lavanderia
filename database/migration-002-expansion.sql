-- Laundri-Sync v2: Expansion migration
-- Run AFTER init.sql

-- 1. Corporate companies table
CREATE TABLE corporate_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cuit TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Client profiles table (vertical differentiation)
CREATE TABLE client_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('RESIDENT', 'CORPORATE', 'WALK_IN')),
  corporate_id UUID REFERENCES corporate_details(id) ON DELETE SET NULL,
  -- Walk-in / corporate contact fields
  name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_client_profiles_user ON client_profiles (user_id);
CREATE INDEX idx_client_profiles_type ON client_profiles (profile_type);
CREATE INDEX idx_client_profiles_corporate ON client_profiles (corporate_id);

-- 3. Extend orders with payment and billing columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pending'
  CHECK (payment_status IN ('Pending', 'Paid'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT
  CHECK (payment_method IN ('MercadoPago', 'Cash', 'Transfer', 'Other'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_data JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'RESIDENT'
  CHECK (profile_type IN ('RESIDENT', 'CORPORATE', 'WALK_IN'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS corporate_id UUID REFERENCES corporate_details(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mp_preference_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 4. Promotions tracking table
CREATE TABLE promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_orders INT NOT NULL DEFAULT 0,
  free_orders_earned INT NOT NULL DEFAULT 0,
  free_orders_used INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_promotions_user ON promotions (user_id);

-- 5. Remitos (digital receipts) table
CREATE TABLE remitos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  remito_number TEXT NOT NULL UNIQUE,
  pdf_url TEXT,
  validation_qr TEXT,
  afip_cae TEXT,
  afip_status TEXT DEFAULT 'pending'
    CHECK (afip_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_remitos_order ON remitos (order_id);

-- 6. Enable RLS on new tables
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE remitos ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies
CREATE POLICY "service_role_all_client_profiles"
  ON client_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_can_insert_client_profiles"
  ON client_profiles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_can_read_own_profile"
  ON client_profiles FOR SELECT TO anon USING (true);

CREATE POLICY "service_role_all_corporate"
  ON corporate_details FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_can_read_corporate"
  ON corporate_details FOR SELECT TO anon USING (true);

CREATE POLICY "service_role_all_promotions"
  ON promotions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_can_read_own_promotions"
  ON promotions FOR SELECT TO anon USING (true);

CREATE POLICY "service_role_all_remitos"
  ON remitos FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8. Seed corporate companies
INSERT INTO corporate_details (name, cuit, business_name, address) VALUES
  ('Empresa A', '30-12345678-9', 'Empresa A S.A.', 'Av. Siempre Viva 123'),
  ('Empresa B', '30-23456789-0', 'Empresa B S.R.L.', 'Calle Falsa 456'),
  ('Empresa C', '30-34567890-1', 'Empresa C S.A.', 'Belgrano 789'),
  ('Empresa D', '30-45678901-2', 'Empresa D S.H.', 'San Martín 321'),
  ('Empresa E', '30-56789012-3', 'Empresa E S.A.', 'Perú 654'),
  ('Empresa F', '30-67890123-4', 'Empresa F S.R.L.', 'Rivadavia 987');
