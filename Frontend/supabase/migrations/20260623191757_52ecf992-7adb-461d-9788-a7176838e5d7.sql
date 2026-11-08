
CREATE TABLE public.inventory_shrinkage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  scan_code TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_shrinkage TO anon, authenticated;
GRANT ALL ON public.inventory_shrinkage TO service_role;

ALTER TABLE public.inventory_shrinkage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shrinkage" ON public.inventory_shrinkage FOR SELECT USING (true);
CREATE POLICY "Anyone can create shrinkage" ON public.inventory_shrinkage FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update shrinkage" ON public.inventory_shrinkage FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete shrinkage" ON public.inventory_shrinkage FOR DELETE USING (true);
