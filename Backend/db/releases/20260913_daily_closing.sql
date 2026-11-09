-- Authorized production release. Schema only; no test data.
BEGIN;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS default_opening_cash numeric(14,2) CHECK(default_opening_cash>=0);
ALTER TABLE everyday_closing ADD COLUMN IF NOT EXISTS business_date date;
ALTER TABLE everyday_closing ADD COLUMN IF NOT EXISTS closing_status varchar(16) NOT NULL DEFAULT 'CLOSED' CHECK(closing_status IN ('DRAFT','CLOSED'));
ALTER TABLE everyday_closing ADD COLUMN IF NOT EXISTS opening_cash numeric(14,2) NOT NULL DEFAULT 0 CHECK(opening_cash>=0);
ALTER TABLE everyday_closing ADD COLUMN IF NOT EXISTS cash_added numeric(14,2) NOT NULL DEFAULT 0 CHECK(cash_added>=0);
ALTER TABLE everyday_closing ADD COLUMN IF NOT EXISTS cash_drops numeric(14,2) NOT NULL DEFAULT 0 CHECK(cash_drops>=0);
ALTER TABLE everyday_closing ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';
ALTER TABLE everyday_closing ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;
ALTER TABLE everyday_closing ADD COLUMN IF NOT EXISTS sales_snapshot jsonb;
UPDATE everyday_closing c SET business_date=(c.opening_datetime AT TIME ZONE s.timezone)::date FROM stores s WHERE c.dgt_id=s.dgt_id AND c.business_date IS NULL;
ALTER TABLE everyday_closing ALTER COLUMN business_date SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS everyday_closing_store_business_date ON everyday_closing(dgt_id,business_date);
ALTER TABLE everyday_closing
  ADD COLUMN opening_checks numeric(12,2) CHECK (opening_checks >= 0),
  ADD COLUMN closing_checks numeric(12,2) CHECK (closing_checks >= 0),
  ADD COLUMN card_jobber_settlement numeric(12,2),
  ADD COLUMN card_bank_settlement numeric(12,2),
  ADD COLUMN lottery_online_sales numeric(12,2),
  ADD COLUMN lottery_online_cash numeric(12,2),
  ADD COLUMN lottery_scratch_cash numeric(12,2),
  ADD COLUMN lottery_settlement numeric(12,2),
  ADD COLUMN lottery_adjustment numeric(12,2),
  ADD COLUMN lottery_online_credit numeric(12,2),
  ADD COLUMN lottery_scratch_credit numeric(12,2),
  ADD COLUMN lottery_commission numeric(12,2),
  ADD COLUMN lottery_balance numeric(12,2);
ALTER TABLE daily_closing_deposits ALTER COLUMN bank_account_id DROP NOT NULL;
ALTER TABLE daily_closing_deposits
  ADD COLUMN closing_entry boolean NOT NULL DEFAULT false,
  ADD COLUMN cash_amount numeric(12,2) CHECK(cash_amount >= 0 AND cash_amount <= amount),
  ADD COLUMN checks_amount numeric(12,2) CHECK(checks_amount >= 0 AND checks_amount <= amount);
COMMIT;
