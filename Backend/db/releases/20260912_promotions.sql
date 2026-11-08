-- Production release of tested promotion management. One-time transaction; no POS execution.
BEGIN;
SET LOCAL lock_timeout='5s';
DO $$ BEGIN IF current_database()<>'dgt' THEN RAISE EXCEPTION 'Production dgt only'; END IF; END $$;
ALTER TABLE promotions
 ADD COLUMN buy_quantity integer CHECK (buy_quantity>0),
 ADD COLUMN free_quantity integer CHECK (free_quantity>0),
 ADD COLUMN is_active boolean NOT NULL DEFAULT true,
 ADD COLUMN creation_key uuid,
 ADD COLUMN creation_payload jsonb,
 ADD CONSTRAINT promotion_store_key UNIQUE(promotion_id,dgt_id),
 ADD CONSTRAINT promotion_creation_key UNIQUE(dgt_id,creation_key);
UPDATE promotions SET is_active=false WHERE upper(status) IN ('INACTIVE','DEACTIVATED','CANCELLED');
ALTER TABLE promotion_products
 ADD COLUMN dgt_id varchar(50),
 ADD COLUMN required_quantity integer NOT NULL DEFAULT 1 CHECK (required_quantity>0);
UPDATE promotion_products pp SET dgt_id=p.dgt_id FROM promotions p WHERE p.promotion_id=pp.promotion_id;
ALTER TABLE promotion_products ALTER COLUMN dgt_id SET NOT NULL;
ALTER TABLE promotion_products
 ADD CONSTRAINT promotion_link_store_fk FOREIGN KEY(promotion_id,dgt_id) REFERENCES promotions(promotion_id,dgt_id),
 ADD CONSTRAINT promotion_product_store_fk FOREIGN KEY(product_id,dgt_id) REFERENCES products(product_id,dgt_id);
COMMIT;
