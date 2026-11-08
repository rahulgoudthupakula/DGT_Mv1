-- Production release authorized by user; no test fixtures or test role grants.
BEGIN;
DO $$ BEGIN IF current_database()<>'dgt' THEN RAISE EXCEPTION 'dgt required'; END IF; END $$;
CREATE TABLE purchase_orders (
 purchase_order_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 dgt_id varchar(50) NOT NULL REFERENCES stores(dgt_id),
 vendor_id bigint NOT NULL REFERENCES vendors(vendor_id),
 po_number varchar(100) NOT NULL,
 order_date date NOT NULL,
 expected_delivery_date date,
 status varchar(30) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Submitted','Partially Received','Received','Cancelled')),
 source varchar(40) NOT NULL CHECK (source IN ('Suggested Order Guide','Vendor Order Guide')),
 notes text,
 created_by bigint NOT NULL REFERENCES users(user_id),
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 request_key uuid NOT NULL,
 UNIQUE(dgt_id,po_number), UNIQUE(dgt_id,request_key)
);
CREATE TABLE purchase_order_lines (
 purchase_order_line_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 purchase_order_id bigint NOT NULL REFERENCES purchase_orders(purchase_order_id),
 product_id bigint NOT NULL REFERENCES products(product_id),
 sku varchar(100) NOT NULL,
 barcode varchar(100),
 item_name varchar(200) NOT NULL,
 department varchar(200),
 ordered_quantity numeric(12,3) NOT NULL CHECK (ordered_quantity>0),
 received_quantity numeric(12,3) NOT NULL DEFAULT 0 CHECK (received_quantity>=0 AND received_quantity<=ordered_quantity),
 case_pack_size integer NOT NULL CHECK (case_pack_size>0),
 unit_cost numeric(12,2) NOT NULL CHECK (unit_cost>=0),
 UNIQUE(purchase_order_id,product_id)
);
ALTER TABLE purchase_orders DROP CONSTRAINT purchase_orders_status_check;
UPDATE purchase_orders SET status='Pending Approval' WHERE status='Submitted';
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_status_check CHECK(status IN ('Draft','Pending Approval','Approved','Cancelled','Partially Received','Received'));
ALTER TABLE purchase_orders ADD COLUMN approved_by bigint REFERENCES users(user_id), ADD COLUMN approved_at timestamptz;
ALTER TABLE invoices ADD CONSTRAINT invoices_purchase_order_fk FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders(purchase_order_id);
ALTER TABLE grocery_invoice_items ADD COLUMN received_quantity numeric(12,3) CHECK(received_quantity>=0), ADD COLUMN line_tax numeric(12,2) NOT NULL DEFAULT 0 CHECK(line_tax>=0);
UPDATE grocery_invoice_items SET received_quantity=quantity;
ALTER TABLE invoices
 ADD COLUMN delivery_time time,
 ADD COLUMN driver_name varchar(200),
 ADD COLUMN driver_number varchar(100),
 ADD COLUMN route_id varchar(100),
 ADD COLUMN payment_terms varchar(200),
 ADD COLUMN notes varchar(4000);
ALTER TABLE invoice_charges
 ADD COLUMN freight_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK(freight_amount>=0),
 ADD COLUMN fuel_surcharge numeric(12,2) NOT NULL DEFAULT 0 CHECK(fuel_surcharge>=0),
 ADD COLUMN handling_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK(handling_fee>=0);
CREATE UNIQUE INDEX invoice_charges_grocery_unique ON invoice_charges(invoice_id) WHERE charge_type='GROCERY';
COMMIT;
