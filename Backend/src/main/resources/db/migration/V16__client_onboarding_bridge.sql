-- Only DGT account provisioning receipts are kept here. Portal staff, reviews,
-- setup tokens and support conversations live in the separate portal database.
CREATE TABLE client_onboarding_provisions (
 request_id uuid PRIMARY KEY,
 company_id bigint NOT NULL REFERENCES companies,
 dgt_id varchar(50) NOT NULL REFERENCES stores,
 user_id bigint NOT NULL REFERENCES users,
 request_payload jsonb NOT NULL,
 activated_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
