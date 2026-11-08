-- Approved live release; additive changes only.
BEGIN;
DO $$ BEGIN IF current_database() <> 'dgt' THEN RAISE EXCEPTION 'dgt required'; END IF; END $$;
ALTER TABLE inventory_returns
 ADD COLUMN reduction_request_id bigint REFERENCES inventory_reduction_requests(reduction_request_id),
 ADD COLUMN settled_at timestamptz,
 ADD COLUMN settled_by bigint REFERENCES users(user_id);
CREATE UNIQUE INDEX inventory_returns_reduction_request_uq ON inventory_returns(reduction_request_id);
ALTER TABLE inventory_transfers ADD COLUMN reduction_request_id bigint REFERENCES inventory_reduction_requests(reduction_request_id);
CREATE UNIQUE INDEX inventory_transfers_reduction_request_uq ON inventory_transfers(reduction_request_id);
ALTER TABLE inventory_transfer_items ADD COLUMN destination_product_id bigint REFERENCES products(product_id);
COMMIT;
