-- Approved local closing flow, with shared/separate counter selection.
ALTER TABLE public.stores ADD COLUMN lottery_separate_counter boolean;
ALTER TABLE public.lottery_pack_inventory
  ADD COLUMN counter_separate boolean,
  ADD COLUMN business_date date,
  ADD COLUMN closing_type varchar(10),
  ADD COLUMN cash_counted numeric(12,2),
  ADD COLUMN variance_note text,
  ADD COLUMN shift_closed_by bigint REFERENCES public.users(user_id),
  ADD CONSTRAINT lottery_closing_type_check CHECK (closing_type IN ('DAY','SHIFT')),
  ADD CONSTRAINT lottery_cash_counted_check CHECK (cash_counted >= 0),
  ADD CONSTRAINT lottery_closing_complete_check CHECK (
    business_date IS NULL OR (
      closing_type IS NOT NULL AND counter_separate IS NOT NULL AND
      ((shift_closed_at IS NULL AND shift_closed_by IS NULL) OR
       (shift_closed_at IS NOT NULL AND shift_closed_by IS NOT NULL AND (NOT counter_separate OR cash_counted IS NOT NULL)))
    )
  );

ALTER TABLE public.lottery_pack_inventory_items
  ADD COLUMN end_ticket_snapshot integer,
  ADD COLUMN ticket_price_snapshot numeric(10,2),
  ADD COLUMN commission_percent_snapshot numeric(5,2),
  ADD CONSTRAINT lottery_closing_price_check CHECK (ticket_price_snapshot >= 0),
  ADD CONSTRAINT lottery_closing_commission_check
    CHECK (commission_percent_snapshot BETWEEN 0 AND 100);

-- Protect new managed closings; legacy rows require review before reuse.
CREATE UNIQUE INDEX lottery_one_open_closing_per_store
  ON public.lottery_pack_inventory(dgt_id)
  WHERE shift_closed_at IS NULL AND business_date IS NOT NULL;
CREATE UNIQUE INDEX lottery_closing_pack_unique
  ON public.lottery_pack_inventory_items(lottery_pack_inventory_id,pack_id);
