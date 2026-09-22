-- Explicit receipt-line attribution; never infer a pack from a product name.
ALTER TABLE public.lottery_pack_inventory ADD COLUMN sales_reviewed boolean NOT NULL DEFAULT false, ADD COLUMN sales_period_started_at timestamptz;
ALTER TABLE public.lottery_pack_inventory_items ADD COLUMN recorded_sales_snapshot integer;
CREATE TABLE public.lottery_sales_links (
 sales_item_id bigint PRIMARY KEY REFERENCES public.sales_items(sales_item_id),
 lottery_pack_inventory_id bigint NOT NULL REFERENCES public.lottery_pack_inventory(lottery_pack_inventory_id),
 pack_id bigint NOT NULL REFERENCES public.lottery_packs(lottery_pack_id),
 active boolean NOT NULL DEFAULT true,
 linked_by bigint NOT NULL REFERENCES public.users(user_id),
 linked_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (lottery_pack_inventory_id,pack_id) REFERENCES public.lottery_pack_inventory_items(lottery_pack_inventory_id,pack_id)
);
CREATE INDEX lottery_sales_links_closing ON public.lottery_sales_links(lottery_pack_inventory_id);
