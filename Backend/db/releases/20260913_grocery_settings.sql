-- Production release authorized by user on 2026-09-13.
-- Existing tax flags, item reorder quantities and access_audit_events are reused.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$ BEGIN
 IF current_database()<>'dgt' THEN RAISE EXCEPTION 'dgt required'; END IF;
END $$;

CREATE TABLE grocery_settings (
 dgt_id varchar(50) PRIMARY KEY REFERENCES stores(dgt_id),
 default_tax_type varchar(20) NOT NULL CHECK(default_tax_type IN ('taxable','non_taxable')),
 allow_subdepartment_tax_override boolean NOT NULL,
 allow_item_tax_override boolean NOT NULL,
 tax_rounding varchar(20) NOT NULL CHECK(tax_rounding IN ('standard','round_up','round_down','banker')),
 ebt_tax_exempt boolean NOT NULL,
 wic_tax_exempt boolean NOT NULL,
 expiry_tracking boolean NOT NULL,
 expiry_alert_days integer NOT NULL CHECK(expiry_alert_days BETWEEN 0 AND 3650),
 expired_item_handling varchar(20) NOT NULL CHECK(expired_item_handling IN ('block','warning')),
 expiry_dashboard_notification boolean NOT NULL,
 expiry_email_notification boolean NOT NULL,
 expiry_in_app_notification boolean NOT NULL,
 reorder_rule varchar(20) NOT NULL CHECK(reorder_rule IN ('fixed','days_of_stock')),
 default_lead_time_days integer NOT NULL CHECK(default_lead_time_days BETWEEN 0 AND 3650),
 safety_stock_percentage numeric(7,2) NOT NULL CHECK(safety_stock_percentage BETWEEN 0 AND 1000),
 allow_item_reorder_override boolean NOT NULL,
 updated_by bigint NOT NULL REFERENCES users(user_id),
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE store_sub_departments
 ADD COLUMN default_margin_percentage numeric(5,2)
 CHECK(default_margin_percentage >= 0 AND default_margin_percentage < 100);

-- No seed preferences, invented margins, or browser-local values are imported.
-- No existing retail prices, inventory quantities, or tax flags are rewritten.
COMMIT;
