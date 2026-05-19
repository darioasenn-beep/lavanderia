-- Laundri-Sync B2B: Corporate Remitos Module
-- Run AFTER init.sql and migration-002-expansion.sql

-- 1. Companies table (parallel to corporate_details, for B2B remitos)
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    cuit VARCHAR(11) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Price Lists per Company
CREATE TABLE IF NOT EXISTS price_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    item_description VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. B2B Remitos with automatic ascending numbering
CREATE TABLE IF NOT EXISTS corporate_remitos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE RESTRICT NOT NULL,
    remito_number SERIAL,
    items JSONB NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_remitos ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies (service_role bypasses RLS, anon read-only)
CREATE POLICY "service_role_all_companies"
  ON companies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_can_read_companies"
  ON companies FOR SELECT TO anon USING (true);

CREATE POLICY "service_role_all_price_lists"
  ON price_lists FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_can_read_price_lists"
  ON price_lists FOR SELECT TO anon USING (true);

CREATE POLICY "service_role_all_corporate_remitos"
  ON corporate_remitos FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_can_read_corporate_remitos"
  ON corporate_remitos FOR SELECT TO anon USING (true);

-- 6. Indexes
CREATE INDEX idx_price_lists_company ON price_lists (company_id);
CREATE INDEX idx_corporate_remitos_company ON corporate_remitos (company_id);
CREATE INDEX idx_corporate_remitos_status ON corporate_remitos (status);
