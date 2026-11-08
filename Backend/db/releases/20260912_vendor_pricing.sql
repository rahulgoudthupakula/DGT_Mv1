-- Production release of verified Price Book / Vendor Management schema. One transaction; one-time migration.
-- No sample data, accounts or permissions are copied from test.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$ BEGIN
 IF current_database()<>'dgt' THEN RAISE EXCEPTION 'Production dgt database required'; END IF;
END $$;
ALTER TABLE store_sub_departments ADD COLUMN dgt_id varchar(50);
UPDATE store_sub_departments sub SET dgt_id=dep.dgt_id
 FROM store_departments dep WHERE dep.store_department_id=sub.store_department_id;
ALTER TABLE store_sub_departments ALTER COLUMN dgt_id SET NOT NULL;
ALTER TABLE store_departments ADD CONSTRAINT pricebook_department_store_key UNIQUE(store_department_id,dgt_id);
ALTER TABLE store_sub_departments ADD CONSTRAINT pricebook_subdepartment_store_fk
 FOREIGN KEY(store_department_id,dgt_id) REFERENCES store_departments(store_department_id,dgt_id),
 ADD CONSTRAINT pricebook_subdepartment_store_key UNIQUE(store_sub_department_id,dgt_id);
ALTER TABLE products ADD COLUMN dgt_id varchar(50);
UPDATE products p SET dgt_id=sub.dgt_id FROM store_sub_departments sub
 WHERE sub.store_sub_department_id=p.store_sub_department_id;
ALTER TABLE products ALTER COLUMN dgt_id SET NOT NULL;
ALTER TABLE products ADD CONSTRAINT pricebook_product_store_fk FOREIGN KEY(dgt_id) REFERENCES stores(dgt_id),
 ADD CONSTRAINT pricebook_product_department_fk FOREIGN KEY(store_sub_department_id,dgt_id)
 REFERENCES store_sub_departments(store_sub_department_id,dgt_id),
 ADD CONSTRAINT pricebook_product_store_key UNIQUE(product_id,dgt_id);
ALTER TABLE products DROP CONSTRAINT uq_products_sku;
ALTER TABLE products ADD CONSTRAINT uq_products_store_sku UNIQUE(dgt_id,product_sku);
ALTER TABLE product_barcodes ADD COLUMN dgt_id varchar(50);
UPDATE product_barcodes b SET dgt_id=p.dgt_id FROM products p WHERE p.product_id=b.product_id;
ALTER TABLE product_barcodes ALTER COLUMN dgt_id SET NOT NULL;
ALTER TABLE product_barcodes DROP CONSTRAINT uq_product_barcode_value;
ALTER TABLE product_barcodes ADD CONSTRAINT uq_product_barcode_store_value UNIQUE(dgt_id,product_barcode_value);
ALTER TABLE product_barcodes ADD CONSTRAINT pricebook_barcode_product_store_fk FOREIGN KEY(product_id,dgt_id) REFERENCES products(product_id,dgt_id);
ALTER TABLE product_store_prices ADD CONSTRAINT pricebook_price_product_store_fk
 FOREIGN KEY(product_id,dgt_id) REFERENCES products(product_id,dgt_id);
ALTER TABLE inventory ADD CONSTRAINT pricebook_inventory_product_store_fk
 FOREIGN KEY(product_id,dgt_id) REFERENCES products(product_id,dgt_id);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM vendors) THEN
  RAISE EXCEPTION 'Map existing vendor ownership before applying this proposal';
 END IF;
END $$;
ALTER TABLE vendors ADD COLUMN dgt_id varchar(50) NOT NULL;
ALTER TABLE vendors ADD CONSTRAINT pricebook_vendor_store_fk
 FOREIGN KEY(dgt_id) REFERENCES stores(dgt_id),
 ADD CONSTRAINT pricebook_vendor_store_key UNIQUE(vendor_id,dgt_id);
ALTER TABLE product_vendors ADD COLUMN dgt_id varchar(50);
UPDATE product_vendors pv SET dgt_id=p.dgt_id FROM products p WHERE p.product_id=pv.product_id;
ALTER TABLE product_vendors ALTER COLUMN dgt_id SET NOT NULL;
ALTER TABLE product_vendors ADD CONSTRAINT pricebook_vendor_link_product_fk
 FOREIGN KEY(product_id,dgt_id) REFERENCES products(product_id,dgt_id),
 ADD CONSTRAINT pricebook_vendor_link_vendor_fk
 FOREIGN KEY(vendor_id,dgt_id) REFERENCES vendors(vendor_id,dgt_id);
DO $$ BEGIN IF current_database()<>'dgt' THEN RAISE EXCEPTION 'Production dgt database required'; END IF; END $$;
LOCK TABLE modules IN EXCLUSIVE MODE;
INSERT INTO modules(module_name,description,is_active)
SELECT 'PRICE_BOOK','Store-specific item catalog',true
WHERE NOT EXISTS(SELECT 1 FROM modules WHERE module_name='PRICE_BOOK');
DO $$
DECLARE existing_rule text;
BEGIN
 IF current_database()<>'dgt' THEN RAISE EXCEPTION 'Production dgt database required'; END IF;
 SELECT pg_get_expr(conbin,conrelid) INTO STRICT existing_rule FROM pg_constraint
 WHERE conrelid='store_role_permissions'::regclass AND conname='store_role_permissions_permission_code_check';
 ALTER TABLE store_role_permissions DROP CONSTRAINT store_role_permissions_permission_code_check;
 EXECUTE format('ALTER TABLE store_role_permissions ADD CONSTRAINT store_role_permissions_permission_code_check CHECK ((%s) OR permission_code IN (''PRICE_BOOK_ACCESS''))',existing_rule);
END $$;
SET LOCAL lock_timeout='5s';
DO $$ BEGIN IF current_database()<>'dgt' THEN RAISE EXCEPTION 'Production dgt database required'; END IF; END $$;
ALTER TABLE vendors ADD COLUMN contact_name varchar(150);
ALTER TABLE vendor_contacts ADD COLUMN contract_type varchar(100);
ALTER TABLE vendor_contacts ADD CONSTRAINT vendor_contract_type_allowed CHECK (contract_type IN (
 'Purchase / Supply Agreement','Fixed Price Contract','Tiered / Volume Pricing Contract',
 'Cost-Plus Contract','Volume Incentive Contract','Exclusive Supply Contract','Preferred Vendor Agreement',
 'Delivery / Distribution Agreement','Lease Agreement','Maintenance / Service Contract',
 'Marketing / Display Agreement','Slotting / Placement Agreement'));
ALTER TABLE vendor_contacts ADD CONSTRAINT vendor_contract_store_fk
 FOREIGN KEY(vendor_id,dgt_id) REFERENCES vendors(vendor_id,dgt_id);
DO $$ BEGIN IF current_database()<>'dgt' THEN RAISE EXCEPTION 'Production dgt database required'; END IF; END $$;
ALTER TABLE vendor_contacts ADD COLUMN return_policy varchar(1000);
COMMIT;
