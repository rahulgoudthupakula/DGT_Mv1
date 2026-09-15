-- Retain removed records; application reads exclude archived rows.
ALTER TABLE public.product_barcodes ADD COLUMN archived_at timestamp with time zone;
ALTER TABLE public.promotion_products ADD COLUMN archived_at timestamp with time zone;
ALTER TABLE public.product_price_groups ADD COLUMN archived_at timestamp with time zone;
ALTER TABLE public.product_vendors ADD COLUMN archived_at timestamp with time zone;
ALTER TABLE public.grocery_invoice_items ADD COLUMN archived_at timestamp with time zone;
ALTER TABLE public.fuel_delivery_lines ADD COLUMN archived_at timestamp with time zone;
ALTER TABLE public.fuel_adjustment_lines ADD COLUMN archived_at timestamp with time zone;
ALTER TABLE public.daily_expenses ADD COLUMN archived_at timestamp with time zone;
ALTER TABLE public.daily_closing_tenders ADD COLUMN archived_at timestamp with time zone;
ALTER TABLE public.daily_closing_deposits ADD COLUMN archived_at timestamp with time zone;
ALTER TABLE public.employee_compensation ADD COLUMN archived_at timestamp with time zone;
