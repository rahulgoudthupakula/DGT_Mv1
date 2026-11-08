BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $$ BEGIN IF current_database()<>'dgt' THEN RAISE EXCEPTION 'dgt only'; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM store_subscriptions) OR EXISTS (SELECT 1 FROM billing_invoices) THEN RAISE EXCEPTION 'Existing billing data requires review'; END IF; END $$;
ALTER TABLE store_subscriptions ADD COLUMN current_period_price numeric(10,2) NOT NULL DEFAULT 0 CHECK(current_period_price>=0);
ALTER TABLE store_subscriptions ADD COLUMN cancel_requested_at timestamptz;
ALTER TABLE store_subscriptions ADD CONSTRAINT store_subscription_one_per_store UNIQUE(store_id);
ALTER TABLE billing_invoices ADD COLUMN subscription_id bigint REFERENCES store_subscriptions(subscription_id);
ALTER TABLE billing_invoices ADD COLUMN invoice_kind varchar(20) CHECK(invoice_kind IN ('INITIAL','UPGRADE','RENEWAL'));
ALTER TABLE billing_invoices ADD COLUMN plan_name_snapshot varchar(50);
ALTER TABLE billing_invoices ADD COLUMN currency varchar(3) NOT NULL DEFAULT 'USD' CHECK(currency='USD');
CREATE UNIQUE INDEX billing_invoice_period_once ON billing_invoices(subscription_id,period_start) WHERE invoice_kind IN ('INITIAL','RENEWAL');
CREATE TABLE billing_change_requests (
 user_id bigint NOT NULL REFERENCES users(user_id),
 request_key uuid NOT NULL,
 dgt_id varchar(50) NOT NULL REFERENCES stores(dgt_id),
 action varchar(20) NOT NULL,
 plan_id bigint,
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,request_key)
);
INSERT INTO subscription_plans(plan_name,monthly_price) VALUES ('Basic',60),('Modern',90),('Advanced',120);
COMMIT;
