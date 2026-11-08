CREATE TABLE public.grocery_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor text NOT NULL,
  invoice text NOT NULL DEFAULT '',
  delivery_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Received',
  notes text,
  total_lines integer NOT NULL DEFAULT 0,
  total_units integer NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.grocery_deliveries TO anon, authenticated;
GRANT ALL ON public.grocery_deliveries TO service_role;
ALTER TABLE public.grocery_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view deliveries" ON public.grocery_deliveries FOR SELECT USING (true);
CREATE POLICY "Anyone can create deliveries" ON public.grocery_deliveries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update deliveries" ON public.grocery_deliveries FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete deliveries" ON public.grocery_deliveries FOR DELETE USING (true);

CREATE TABLE public.grocery_delivery_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id uuid NOT NULL REFERENCES public.grocery_deliveries(id) ON DELETE CASCADE,
  sku text NOT NULL,
  barcode text NOT NULL DEFAULT '',
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  unit_type text NOT NULL DEFAULT 'item',
  units_per_case integer NOT NULL DEFAULT 1,
  unit_cost numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.grocery_delivery_lines TO anon, authenticated;
GRANT ALL ON public.grocery_delivery_lines TO service_role;
ALTER TABLE public.grocery_delivery_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view delivery lines" ON public.grocery_delivery_lines FOR SELECT USING (true);
CREATE POLICY "Anyone can create delivery lines" ON public.grocery_delivery_lines FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update delivery lines" ON public.grocery_delivery_lines FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete delivery lines" ON public.grocery_delivery_lines FOR DELETE USING (true);

CREATE INDEX idx_delivery_lines_delivery_id ON public.grocery_delivery_lines(delivery_id);

CREATE TABLE public.item_stock (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  item_name text NOT NULL DEFAULT '',
  quantity_on_hand integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_stock TO anon, authenticated;
GRANT ALL ON public.item_stock TO service_role;
ALTER TABLE public.item_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view item stock" ON public.item_stock FOR SELECT USING (true);
CREATE POLICY "Anyone can create item stock" ON public.item_stock FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update item stock" ON public.item_stock FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete item stock" ON public.item_stock FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_grocery_deliveries_updated_at BEFORE UPDATE ON public.grocery_deliveries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_item_stock_updated_at BEFORE UPDATE ON public.item_stock
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.adjust_item_stock(_sku text, _item_name text, _delta integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.item_stock (sku, item_name, quantity_on_hand)
  VALUES (_sku, _item_name, GREATEST(_delta, 0))
  ON CONFLICT (sku) DO UPDATE
    SET quantity_on_hand = GREATEST(public.item_stock.quantity_on_hand + _delta, 0),
        item_name = COALESCE(NULLIF(EXCLUDED.item_name, ''), public.item_stock.item_name),
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.adjust_item_stock(text, text, integer) TO anon, authenticated, service_role;