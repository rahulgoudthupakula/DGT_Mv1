
CREATE TABLE public.store_transfers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  direction text NOT NULL CHECK (direction IN ('sent','received')),
  item_name text NOT NULL,
  scan_code text NOT NULL,
  quantity integer NOT NULL CHECK (quantity >= 0),
  counterparty_store text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','sent')),
  transferred_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_transfers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_transfers TO authenticated;
GRANT ALL ON public.store_transfers TO service_role;

ALTER TABLE public.store_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view store transfers"
  ON public.store_transfers FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create store transfers"
  ON public.store_transfers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update store transfers"
  ON public.store_transfers FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete store transfers"
  ON public.store_transfers FOR DELETE
  USING (true);

CREATE INDEX idx_store_transfers_transferred_at ON public.store_transfers (transferred_at DESC);
CREATE INDEX idx_store_transfers_direction ON public.store_transfers (direction);
