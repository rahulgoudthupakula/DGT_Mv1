-- Approved additive verification and recorded activation fields.
ALTER TABLE public.lottery_packs
  ADD COLUMN verification_status varchar(20) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN verification_decided_by bigint REFERENCES public.users(user_id),
  ADD COLUMN verification_decided_at timestamptz,
  ADD COLUMN verification_reason text,
  ADD COLUMN activation_reference varchar(150),
  ADD COLUMN activation_recorded_by bigint REFERENCES public.users(user_id),
  ADD COLUMN activation_recorded_at timestamptz,
  ADD CONSTRAINT lottery_pack_verification_status_check
    CHECK (verification_status IN ('PENDING','VERIFIED','NOT_VERIFIED')),
  ADD CONSTRAINT lottery_pack_verification_decision_check CHECK (
    (verification_status = 'PENDING' AND verification_decided_by IS NULL
       AND verification_decided_at IS NULL AND verification_reason IS NULL)
    OR (verification_status = 'VERIFIED' AND verification_decided_by IS NOT NULL
       AND verification_decided_at IS NOT NULL AND verification_reason IS NULL)
    OR (verification_status = 'NOT_VERIFIED' AND verification_decided_by IS NOT NULL
       AND verification_decided_at IS NOT NULL AND verification_reason IS NOT NULL
       AND btrim(verification_reason) <> '')
  ),
  ADD CONSTRAINT lottery_pack_activation_record_check CHECK (
    (activation_reference IS NULL AND activation_recorded_by IS NULL AND activation_recorded_at IS NULL)
    OR (activation_reference IS NOT NULL AND btrim(activation_reference) <> ''
       AND activation_recorded_by IS NOT NULL AND activation_recorded_at IS NOT NULL
       AND verification_status = 'VERIFIED')
  );
