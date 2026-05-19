-- Laundri-Sync B2B: Billing entities (ACME / ESTEVE)
-- Run AFTER migration-004-billing.sql

ALTER TABLE corporate_remitos
  ADD COLUMN IF NOT EXISTS billing_entity VARCHAR(50) DEFAULT NULL;
