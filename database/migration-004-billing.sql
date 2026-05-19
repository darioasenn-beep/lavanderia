-- Laundri-Sync B2B: Monthly billing closure
-- Run AFTER migration-003-b2b.sql

ALTER TABLE corporate_remitos
  ADD COLUMN IF NOT EXISTS billed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_corporate_remitos_billed
  ON corporate_remitos (billed_at);
