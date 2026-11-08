CREATE OR REPLACE FUNCTION public.adjust_item_stock(_sku text, _item_name text, _delta integer)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
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