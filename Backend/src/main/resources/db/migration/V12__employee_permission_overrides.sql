-- Overrides belong to a login in one store; role defaults remain unchanged.
CREATE TABLE public.user_store_permission_overrides (
 dgt_id varchar(50) NOT NULL REFERENCES public.stores(dgt_id),
 user_id bigint NOT NULL REFERENCES public.users(user_id),
 overrides jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(overrides)='object'),
 updated_by bigint NOT NULL REFERENCES public.users(user_id),
 updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (dgt_id,user_id)
);
