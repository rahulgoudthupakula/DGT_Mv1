BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$ BEGIN IF current_database()<>'dgt' THEN RAISE EXCEPTION 'dgt only'; END IF; END $$;
CREATE TABLE billing_addons (
 addon_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 code varchar(40) NOT NULL UNIQUE,
 name varchar(80) NOT NULL,
 description text NOT NULL,
 monthly_price numeric(10,2) NOT NULL CHECK(monthly_price>=0)
);
CREATE TABLE store_billing_addons (
 subscription_id bigint NOT NULL REFERENCES store_subscriptions(subscription_id) ON DELETE CASCADE,
 addon_id bigint NOT NULL REFERENCES billing_addons(addon_id),
 active boolean NOT NULL DEFAULT true,
 cancel_at_period_end boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(subscription_id,addon_id)
);
ALTER TABLE billing_invoices DROP CONSTRAINT billing_invoices_invoice_kind_check;
ALTER TABLE billing_invoices ADD CONSTRAINT billing_invoices_invoice_kind_check CHECK(invoice_kind IN ('INITIAL','UPGRADE','RENEWAL','ADDON'));
INSERT INTO billing_addons(code,name,description,monthly_price) VALUES
 ('EXTRA_USER','Extra User','One additional user seat. User seat limits are pending implementation.',10),
 ('PAYROLL','Payroll Module','Payroll subscription add-on. Payroll processing is pending implementation.',30),
 ('ADVANCED_REPORTS','Advanced Reports','Advanced reporting subscription add-on. Report screens are pending implementation.',20);
COMMIT;
