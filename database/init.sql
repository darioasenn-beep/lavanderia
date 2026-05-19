-- Laundri-Sync: Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- 1. Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT NOT NULL,
  last_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_users_room ON users (room_number);

-- 2. Bags (QR codes) table
CREATE TABLE bags (
  qr_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Available'
    CHECK (status IN ('Available', 'Assigned', 'In-Laundry')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bags_user ON bags (user_id);
CREATE INDEX idx_bags_status ON bags (status);

-- 3. Orders table
CREATE TABLE orders (
  order_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qr_id TEXT NOT NULL REFERENCES bags(qr_id) ON DELETE CASCADE,
  item_count INTEGER NOT NULL CHECK (item_count > 0),
  service_type TEXT NOT NULL DEFAULT 'Regular'
    CHECK (service_type IN ('Regular', 'Delicado')),
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Processing', 'Ready', 'Delivered')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_user ON orders (user_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_qr ON orders (qr_id);

-- 4. Function to update updated_at on order changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 5. Function to update bag status when order changes
CREATE OR REPLACE FUNCTION update_bag_status_on_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Pending' THEN
    UPDATE bags SET status = 'In-Laundry'
    WHERE qr_id = NEW.qr_id AND status <> 'In-Laundry';
  ELSIF NEW.status IN ('Ready', 'Delivered') THEN
    UPDATE bags SET status = 'Assigned'
    WHERE qr_id = NEW.qr_id AND status = 'In-Laundry';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bag_status_on_order
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_bag_status_on_order();

-- 6. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for users
-- Service role (used by API routes) has full access via BYPASS RLS
-- Anon role can insert new users and read their own data
CREATE POLICY "anon_can_insert_users"
  ON users FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_can_read_own_user"
  ON users FOR SELECT
  TO anon
  USING (true);

-- 8. RLS Policies for bags
CREATE POLICY "anon_can_read_bags"
  ON bags FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_can_update_own_bag"
  ON bags FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- 9. RLS Policies for orders
CREATE POLICY "anon_can_insert_orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_can_read_own_orders"
  ON orders FOR SELECT
  TO anon
  USING (true);

-- 10. Seed some available QR codes (run separately to generate more)
-- INSERT INTO bags (qr_id) VALUES
--   ('ABC12345'), ('DEF67890'), ('GHI13579'), ('JKL24680');
