-- Additive lottery receipt fields; approved for local implementation.
ALTER TABLE public.lottery_games
  ADD CONSTRAINT lottery_games_store_game_unique UNIQUE (dgt_id, lottery_game_id);

ALTER TABLE public.lottery_packs
  ADD COLUMN lottery_game_id bigint,
  ADD COLUMN pack_number varchar(50),
  ADD COLUMN received_ticket_price numeric(10,2),
  ADD COLUMN received_pack_value numeric(12,2),
  ADD COLUMN delivery_decided_by bigint REFERENCES public.users(user_id),
  ADD COLUMN delivery_decided_at timestamptz,
  ADD COLUMN delivery_rejection_reason text,
  ADD CONSTRAINT lottery_packs_store_game_fk
    FOREIGN KEY (dgt_id, lottery_game_id)
    REFERENCES public.lottery_games(dgt_id, lottery_game_id),
  ADD CONSTRAINT lottery_packs_receipt_identity_check CHECK (
    (lottery_game_id IS NULL AND pack_number IS NULL) OR
    (lottery_game_id IS NOT NULL AND pack_number IS NOT NULL AND btrim(pack_number) <> '')
  ),
  ADD CONSTRAINT lottery_packs_received_price_check CHECK (received_ticket_price >= 0),
  ADD CONSTRAINT lottery_packs_received_value_check CHECK (received_pack_value >= 0),
  ADD CONSTRAINT lottery_packs_delivery_decision_check CHECK (
    (delivery_decided_by IS NULL) = (delivery_decided_at IS NULL)
  ),
  ADD CONSTRAINT lottery_packs_delivery_reason_check CHECK (
    delivery_rejection_reason IS NULL OR
    (delivery_decided_by IS NOT NULL AND btrim(delivery_rejection_reason) <> '')
  );

CREATE UNIQUE INDEX lottery_packs_store_game_book_unique
  ON public.lottery_packs(dgt_id, lottery_game_id, pack_number)
  WHERE lottery_game_id IS NOT NULL AND pack_number IS NOT NULL;

