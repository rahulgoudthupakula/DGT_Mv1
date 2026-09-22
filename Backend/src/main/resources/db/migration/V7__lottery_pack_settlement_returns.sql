-- Pack-level return workflow and immutable settlement totals; no payment is initiated.
ALTER TABLE public.lottery_packs
 ADD COLUMN return_status varchar(10) CHECK (return_status IN ('PENDING','RETURNED')),
 ADD COLUMN return_type varchar(10) CHECK (return_type IN ('full','partial')),
 ADD COLUMN return_reason text,
 ADD COLUMN distributor_return_reference varchar(150),
 ADD COLUMN return_requested_by bigint REFERENCES public.users(user_id),
 ADD COLUMN return_requested_at timestamptz,
 ADD COLUMN return_confirmed_by bigint REFERENCES public.users(user_id),
 ADD COLUMN pack_settlement_reference varchar(100),
 ADD COLUMN pack_settled_at timestamptz,
 ADD COLUMN pack_settled_by bigint REFERENCES public.users(user_id),
 ADD COLUMN settled_gross numeric(12,2),
 ADD COLUMN settled_commission numeric(12,2),
 ADD CONSTRAINT lottery_return_state_check CHECK (return_status IS NULL OR
  (return_type IS NOT NULL AND return_reason IS NOT NULL AND return_requested_by IS NOT NULL AND return_requested_at IS NOT NULL
   AND (return_status='PENDING' OR (return_date IS NOT NULL AND return_confirmed_by IS NOT NULL)))),
 ADD CONSTRAINT lottery_pack_settled_check CHECK (pack_settlement_reference IS NULL OR
  (pack_settled_at IS NOT NULL AND pack_settled_by IS NOT NULL AND settled_gross>=0 AND settled_commission>=0));
CREATE UNIQUE INDEX lottery_pack_settlement_reference_unique ON public.lottery_packs(pack_settlement_reference);
