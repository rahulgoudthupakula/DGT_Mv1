-- Approved production release: Credit Card and EBT. No sample data.
BEGIN;
CREATE TABLE credit_card_settings (
 dgt_id varchar(50) PRIMARY KEY REFERENCES stores(dgt_id),
 default_fee_percent numeric(7,4) NOT NULL DEFAULT 0 CHECK(default_fee_percent BETWEEN 0 AND 100),
 per_transaction_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK(per_transaction_fee>=0),
 fee_difference_percent numeric(7,4) NOT NULL DEFAULT 0.2 CHECK(fee_difference_percent BETWEEN 0 AND 100),
 deposit_tolerance numeric(12,2) NOT NULL DEFAULT 5 CHECK(deposit_tolerance>=0),
 require_fee_review boolean NOT NULL DEFAULT true,
 require_variance_review boolean NOT NULL DEFAULT true,
 enable_chargebacks boolean NOT NULL DEFAULT true,
 require_chargeback_reason boolean NOT NULL DEFAULT true,
 lock_settings_after_settlement boolean NOT NULL DEFAULT false,
 updated_by bigint NOT NULL REFERENCES users(user_id),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE credit_card_processors (
 processor_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 dgt_id varchar(50) NOT NULL REFERENCES stores(dgt_id),
 processor_name varchar(120) NOT NULL CHECK(length(trim(processor_name))>0),
 is_active boolean NOT NULL DEFAULT true,
 settlement_frequency varchar(10) NOT NULL DEFAULT 'DAILY' CHECK(settlement_frequency IN ('DAILY','WEEKLY','MONTHLY')),
 deposit_delay_days integer NOT NULL DEFAULT 1 CHECK(deposit_delay_days BETWEEN 0 AND 90),
 settlement_destination varchar(10) NOT NULL CHECK(settlement_destination IN ('BANK','JOBBER')),
 destination_label varchar(160) NOT NULL,
 created_by bigint NOT NULL REFERENCES users(user_id),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(processor_id,dgt_id)
);
CREATE UNIQUE INDEX credit_card_processor_store_name ON credit_card_processors(dgt_id,lower(trim(processor_name)));
CREATE TABLE credit_card_batches (
 batch_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 dgt_id varchar(50) NOT NULL REFERENCES stores(dgt_id),
 processor_id bigint NOT NULL,
 batch_reference varchar(100) NOT NULL CHECK(length(trim(batch_reference))>0),
 business_date date NOT NULL,
 status varchar(12) NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','SUBMITTED','SETTLED','RECONCILED')),
 source_kind varchar(20) NOT NULL DEFAULT 'MANUAL_GROUP' CHECK(source_kind IN ('MANUAL_GROUP','POS_BATCH')),
 pos_sales numeric(14,2) NOT NULL,
 transaction_count integer NOT NULL CHECK(transaction_count>=0),
 fee_base numeric(14,2) NOT NULL CHECK(fee_base>=0),
 configured_fee_percent numeric(7,4) NOT NULL CHECK(configured_fee_percent BETWEEN 0 AND 100),
 per_transaction_fee numeric(12,2) NOT NULL CHECK(per_transaction_fee>=0),
 expected_fee numeric(14,2) NOT NULL CHECK(expected_fee>=0),
 actual_fee numeric(14,2) CHECK(actual_fee>=0),
 processor_sales numeric(14,2),
 chargebacks numeric(14,2) NOT NULL DEFAULT 0 CHECK(chargebacks>=0),
 chargeback_reason varchar(1000),
 fee_reason varchar(1000),notes varchar(2000),
 settlement_destination varchar(10) NOT NULL CHECK(settlement_destination IN ('BANK','JOBBER')),
 destination_label varchar(160) NOT NULL,
 received_amount numeric(14,2),settlement_date date,settlement_reference varchar(160),
 variance_review_note varchar(1000),variance_reviewed_by bigint REFERENCES users(user_id),
 fee_reviewed_by bigint REFERENCES users(user_id),
 created_by bigint NOT NULL REFERENCES users(user_id),
 settled_by bigint REFERENCES users(user_id),reconciled_by bigint REFERENCES users(user_id),
 request_key uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(processor_id,dgt_id) REFERENCES credit_card_processors(processor_id,dgt_id),
 UNIQUE(dgt_id,processor_id,batch_reference),UNIQUE(dgt_id,request_key),
 CHECK(status NOT IN ('SUBMITTED','SETTLED','RECONCILED') OR processor_sales IS NOT NULL),
 CHECK(status NOT IN ('SETTLED','RECONCILED') OR (received_amount IS NOT NULL AND actual_fee IS NOT NULL AND settlement_date IS NOT NULL AND length(trim(settlement_reference))>0 AND settled_by IS NOT NULL)),
 CHECK(status<>'RECONCILED' OR reconciled_by IS NOT NULL)
);
CREATE INDEX credit_card_batches_store_date ON credit_card_batches(dgt_id,business_date,batch_id);
CREATE TABLE credit_card_batch_payments (
 batch_id bigint NOT NULL REFERENCES credit_card_batches(batch_id),
 sale_payment_id bigint NOT NULL REFERENCES sale_payments(sale_payment_id),
 payment_amount_snapshot numeric(14,2) NOT NULL,
 PRIMARY KEY(batch_id,sale_payment_id),UNIQUE(sale_payment_id)
);
CREATE FUNCTION validate_credit_card_batch_store() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM credit_card_batches b JOIN sale_payments p ON p.sale_payment_id=NEW.sale_payment_id JOIN sales s ON s.sale_id=p.sale_id WHERE b.batch_id=NEW.batch_id AND b.dgt_id=s.store_id) THEN
  RAISE EXCEPTION 'Payment must belong to the batch store';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER credit_card_batch_store_guard BEFORE INSERT OR UPDATE ON credit_card_batch_payments FOR EACH ROW EXECUTE FUNCTION validate_credit_card_batch_store();
CREATE TABLE ebt_batches (
 batch_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 dgt_id varchar(50) NOT NULL REFERENCES stores(dgt_id),
 batch_reference varchar(100) NOT NULL CHECK(length(trim(batch_reference))>0),
 business_date date NOT NULL,
 source_kind varchar(20) NOT NULL DEFAULT 'MANUAL_GROUP' CHECK(source_kind IN ('MANUAL_GROUP','POS_BATCH')),
 status varchar(12) NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','SETTLED','RECONCILED')),
 snap_amount numeric(14,2) NOT NULL,
 cash_amount numeric(14,2) NOT NULL,
 refund_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK(refund_amount>=0),
 transaction_count integer NOT NULL CHECK(transaction_count>=0),
 fees numeric(14,2) CHECK(fees>=0),
 adjustment_amount numeric(14,2) NOT NULL DEFAULT 0,
 adjustment_reason varchar(1000),
 actual_deposit numeric(14,2),
 settlement_date date,
 settlement_reference varchar(160),
 variance_review_note varchar(1000),
 notes varchar(2000),
 created_by bigint NOT NULL REFERENCES users(user_id),
 settled_by bigint REFERENCES users(user_id),
 reconciled_by bigint REFERENCES users(user_id),
 request_key uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(dgt_id,batch_reference),
 UNIQUE(dgt_id,request_key),
 CHECK(adjustment_amount=0 OR coalesce(length(trim(adjustment_reason)),0)>0),
 CHECK(settlement_date IS NULL OR settlement_date>=business_date),
 CHECK(status='OPEN' OR (fees IS NOT NULL AND actual_deposit IS NOT NULL
   AND settlement_date IS NOT NULL AND coalesce(length(trim(settlement_reference)),0)>0 AND settled_by IS NOT NULL)),
 CHECK(status<>'RECONCILED' OR (reconciled_by IS NOT NULL AND
   (actual_deposit=snap_amount+cash_amount+adjustment_amount-fees
    OR coalesce(length(trim(variance_review_note)),0)>0)))
);
CREATE INDEX ebt_batches_store_date ON ebt_batches(dgt_id,business_date,batch_id);
CREATE TABLE ebt_batch_payments (
 batch_id bigint NOT NULL REFERENCES ebt_batches(batch_id),
 sale_payment_id bigint NOT NULL REFERENCES sale_payments(sale_payment_id),
 benefit_type varchar(10) NOT NULL CHECK(benefit_type IN ('SNAP','CASH')),
 payment_amount_snapshot numeric(14,2) NOT NULL,
 PRIMARY KEY(batch_id,sale_payment_id),
 UNIQUE(sale_payment_id)
);
CREATE FUNCTION validate_ebt_batch_payment() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM ebt_batches b
   JOIN sale_payments p ON p.sale_payment_id=NEW.sale_payment_id
   JOIN sales s ON s.sale_id=p.sale_id
   JOIN tender_types t ON t.tender_type_id=p.tender_type_id
   WHERE b.batch_id=NEW.batch_id AND b.dgt_id=s.store_id
     AND ((NEW.benefit_type='SNAP' AND t.tender_code='EBT_SNAP')
       OR (NEW.benefit_type='CASH' AND t.tender_code='EBT_CASH'))
 ) THEN
   RAISE EXCEPTION 'EBT payment must match the batch store and benefit type';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER ebt_batch_payment_guard BEFORE INSERT OR UPDATE ON ebt_batch_payments
 FOR EACH ROW EXECUTE FUNCTION validate_ebt_batch_payment();
COMMIT;
