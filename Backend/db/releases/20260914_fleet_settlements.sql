-- User-authorized Fleet production release; no sample data.
-- Reuses sales, sales_items, sale_payments, tender_types and access_audit_events.
-- Provider name is a batch snapshot; no new processor/settings table is needed.
BEGIN;
CREATE TABLE fleet_batches (
 batch_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 dgt_id varchar(50) NOT NULL REFERENCES stores(dgt_id),
 provider_name varchar(120) NOT NULL CHECK(length(trim(provider_name))>0),
 batch_reference varchar(100) NOT NULL CHECK(length(trim(batch_reference))>0),
 business_date date NOT NULL,
 source_kind varchar(20) NOT NULL DEFAULT 'MANUAL_GROUP' CHECK(source_kind IN ('MANUAL_GROUP','POS_BATCH')),
 status varchar(12) NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','SETTLED','RECONCILED')),
 fleet_sales numeric(14,2) NOT NULL,
 gallons_sold numeric(16,3),
 fuel_sales numeric(14,2),
 volume_note varchar(1000),
 transaction_count integer NOT NULL CHECK(transaction_count>=0),
 statement_discount numeric(14,2) CHECK(statement_discount>=0),
 processor_fee numeric(14,2) CHECK(processor_fee>=0),
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
 UNIQUE(dgt_id,request_key),
 CHECK((gallons_sold IS NULL)=(fuel_sales IS NULL)),
 CHECK(gallons_sold IS NOT NULL OR coalesce(length(trim(volume_note)),0)>0),
 CHECK(settlement_date IS NULL OR settlement_date>=business_date),
 CHECK(status='OPEN' OR (statement_discount IS NOT NULL AND processor_fee IS NOT NULL
   AND actual_deposit IS NOT NULL AND settlement_date IS NOT NULL
   AND coalesce(length(trim(settlement_reference)),0)>0 AND settled_by IS NOT NULL)),
 CHECK(status<>'RECONCILED' OR (reconciled_by IS NOT NULL AND
   (actual_deposit=fleet_sales-statement_discount-processor_fee
    OR coalesce(length(trim(variance_review_note)),0)>0)))
);
CREATE UNIQUE INDEX fleet_batches_store_provider_reference
 ON fleet_batches(dgt_id,lower(trim(provider_name)),batch_reference);
CREATE INDEX fleet_batches_store_date ON fleet_batches(dgt_id,business_date,batch_id);
CREATE TABLE fleet_batch_payments (
 batch_id bigint NOT NULL REFERENCES fleet_batches(batch_id),
 sale_payment_id bigint NOT NULL REFERENCES sale_payments(sale_payment_id),
 payment_amount_snapshot numeric(14,2) NOT NULL,
 PRIMARY KEY(batch_id,sale_payment_id),
 UNIQUE(sale_payment_id)
);
CREATE FUNCTION validate_fleet_batch_payment() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM fleet_batches b
   JOIN sale_payments p ON p.sale_payment_id=NEW.sale_payment_id
   JOIN sales s ON s.sale_id=p.sale_id
   JOIN tender_types t ON t.tender_type_id=p.tender_type_id
   WHERE b.batch_id=NEW.batch_id AND b.dgt_id=s.store_id
     AND upper(t.tender_code) IN ('FLEET','FLEET_CARD')
 ) THEN
   RAISE EXCEPTION 'Fleet payment must belong to the batch store and use a Fleet tender';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER fleet_batch_payment_guard BEFORE INSERT OR UPDATE ON fleet_batch_payments
 FOR EACH ROW EXECUTE FUNCTION validate_fleet_batch_payment();
COMMIT;
