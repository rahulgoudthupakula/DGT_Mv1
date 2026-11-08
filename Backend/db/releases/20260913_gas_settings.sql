-- Production release authorized on 2026-09-13.
-- Reuses fuel_grades, fuel_tanks, fuel_tank_grade_assignments and access_audit_events.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$ BEGIN IF current_database()<>'dgt' THEN RAISE EXCEPTION 'dgt required'; END IF; END $$;
CREATE TABLE gas_settings (
 dgt_id varchar(50) PRIMARY KEY REFERENCES stores(dgt_id),
 plus_tank_type varchar(20) CHECK(plus_tank_type IN ('blended','separate')),
 blend_regular_percentage numeric(5,2) CHECK(blend_regular_percentage BETWEEN 0 AND 100),
 sells_diesel boolean NOT NULL,
 two_blended_grades boolean NOT NULL,
 federal_multiplier numeric(12,6) CHECK(federal_multiplier>=0),
 federal_tolerance_gallons numeric(12,3) CHECK(federal_tolerance_gallons>=0),
 state_multiplier numeric(12,6) CHECK(state_multiplier>=0),
 state_tolerance_gallons numeric(12,3) CHECK(state_tolerance_gallons>=0),
 report_state varchar(100),
 supplier_payment_method varchar(20) CHECK(supplier_payment_method IN ('ach','check','wire','auto-debit')),
 gas_brand_type varchar(20) CHECK(gas_brand_type IN ('branded','unbranded')),
 card_settlement_method varchar(20) CHECK(card_settlement_method IN ('direct','jobber')),
 allowed_variance_percentage numeric(5,2) CHECK(allowed_variance_percentage BETWEEN 0 AND 100),
 daily_loss_threshold_gallons numeric(12,3) CHECK(daily_loss_threshold_gallons>=0),
 auto_flag_variance boolean NOT NULL,
 variance_approval_required boolean NOT NULL,
 low_tank_dashboard boolean NOT NULL,
 low_tank_email boolean NOT NULL,
 high_variance_dashboard boolean NOT NULL,
 high_variance_email boolean NOT NULL,
 repeated_loss_dashboard boolean NOT NULL,
 repeated_loss_email boolean NOT NULL,
 missing_reading_dashboard boolean NOT NULL,
 missing_reading_email boolean NOT NULL,
 lock_critical_after_delivery boolean NOT NULL,
 updated_by bigint NOT NULL REFERENCES users(user_id),
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE fuel_tanks
 ADD COLUMN capacity_locked boolean NOT NULL DEFAULT true,
 ADD COLUMN low_level_percentage numeric(5,2) CHECK(low_level_percentage BETWEEN 0 AND 100),
 ADD COLUMN prepaid_tax_per_gallon numeric(12,4) CHECK(prepaid_tax_per_gallon>=0),
 ADD COLUMN tax_rate_per_gallon numeric(12,4) CHECK(tax_rate_per_gallon>=0),
 ADD COLUMN ust_fee_per_gallon numeric(12,4) CHECK(ust_fee_per_gallon>=0),
 ADD COLUMN pos_mapping varchar(100);
-- No fabricated banks, grades, tank volumes, tax rates or saved preferences seeded.
-- Taxes/tolerances are user-entered configuration, not supplied legal rates.
-- Existing tanks retain their identity, capacity, safe-fill limit and grade history.

-- Extend the existing permission whitelist; retain all existing allowed codes.
DO $$
DECLARE existing_rule text;
BEGIN
 IF current_database()<>'dgt' THEN RAISE EXCEPTION 'Production dgt only'; END IF;
 SELECT pg_get_expr(conbin,conrelid) INTO STRICT existing_rule FROM pg_constraint
 WHERE conrelid='store_role_permissions'::regclass AND conname='store_role_permissions_permission_code_check';
 ALTER TABLE store_role_permissions DROP CONSTRAINT store_role_permissions_permission_code_check;
 EXECUTE format('ALTER TABLE store_role_permissions ADD CONSTRAINT store_role_permissions_permission_code_check CHECK ((%s) OR permission_code IN (''GAS_SETTINGS''))',existing_rule);
END $$;
COMMIT;
