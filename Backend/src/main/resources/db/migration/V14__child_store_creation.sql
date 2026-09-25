ALTER TABLE public.stores
 ADD COLUMN parent_store_dgt_id varchar(50),
 ADD CONSTRAINT stores_parent_same_company FOREIGN KEY (company_id,parent_store_dgt_id) REFERENCES public.stores(company_id,dgt_id),
 ADD CONSTRAINT stores_parent_valid CHECK (parent_store_dgt_id IS NULL OR (company_id IS NOT NULL AND parent_store_dgt_id<>dgt_id));
CREATE INDEX stores_parent_idx ON public.stores(parent_store_dgt_id);
-- Locations belonging to the same business may share legal identity.
ALTER TABLE public.stores DROP CONSTRAINT uq_stores_legal_business_name;
ALTER TABLE public.stores DROP CONSTRAINT uq_stores_tax_id;
CREATE TABLE public.store_creation_requests (
 company_id bigint NOT NULL REFERENCES public.companies(company_id),
 request_key uuid NOT NULL,
 actor_user_id bigint NOT NULL REFERENCES public.users(user_id),
 request_payload jsonb NOT NULL,
 dgt_id varchar(50) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(company_id,request_key),
 FOREIGN KEY(company_id,dgt_id) REFERENCES public.stores(company_id,dgt_id)
);
