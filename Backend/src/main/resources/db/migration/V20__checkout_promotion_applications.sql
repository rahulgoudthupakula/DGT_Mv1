-- Preserve the quote and selected offers for retries and receipt audit history.
CREATE TABLE sale_promotion_applications (
 application_id BIGSERIAL PRIMARY KEY,
 dgt_id VARCHAR(50) NOT NULL REFERENCES stores(dgt_id),
 sale_id BIGINT NOT NULL UNIQUE,
 request_key UUID NOT NULL,
 applied_by BIGINT NOT NULL REFERENCES users(user_id),
 quote_version VARCHAR(64) NOT NULL,
 calculation JSONB NOT NULL,
 applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(dgt_id,request_key),
 FOREIGN KEY(sale_id,dgt_id) REFERENCES sales(sale_id,store_id)
);
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='dgt_app') THEN
  GRANT SELECT,INSERT ON sale_promotion_applications TO dgt_app;
  GRANT USAGE,SELECT ON SEQUENCE sale_promotion_applications_application_id_seq TO dgt_app;
 END IF;
END $$;
