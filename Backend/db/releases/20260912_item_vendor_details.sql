-- One-time production release; preserves existing records and unknown costs.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$ BEGIN
 IF current_database()<>'dgt' THEN RAISE EXCEPTION 'Production dgt only'; END IF;
END $$;
ALTER TABLE products
 ADD COLUMN is_age_restricted boolean,
 ADD COLUMN reorder_level numeric(12,3),
 ADD COLUMN purchase_unit varchar(10),
 ADD COLUMN units_per_case integer,
 ADD COLUMN purchase_gross_cost numeric(12,2),
 ADD COLUMN purchase_discount numeric(12,2),
 ADD CONSTRAINT pricebook_reorder_nonnegative CHECK (reorder_level IS NULL OR reorder_level>=0),
 ADD CONSTRAINT pricebook_purchase_unit CHECK (purchase_unit IS NULL OR purchase_unit IN ('ITEM','CASE')),
 ADD CONSTRAINT pricebook_case_quantity CHECK (units_per_case IS NULL OR units_per_case>0),
 ADD CONSTRAINT pricebook_purchase_cost CHECK (
  (purchase_gross_cost IS NULL AND purchase_discount IS NULL) OR
  (purchase_gross_cost IS NOT NULL AND purchase_discount IS NOT NULL AND
   purchase_gross_cost>=0 AND purchase_discount>=0 AND purchase_discount<=purchase_gross_cost)),
 ADD CONSTRAINT pricebook_purchase_basis CHECK (
  (purchase_gross_cost IS NULL OR purchase_unit IS NOT NULL) AND
  (purchase_unit IS DISTINCT FROM 'CASE' OR units_per_case IS NOT NULL));
DO $$ BEGIN IF current_database()<>'dgt' THEN RAISE EXCEPTION 'Production dgt only'; END IF; END $$;
ALTER TABLE product_vendors
 ADD COLUMN case_pack_quantity integer CHECK (case_pack_quantity>0),
 ADD COLUMN minimum_order_quantity numeric(12,3) CHECK (minimum_order_quantity>0);
COMMIT;
