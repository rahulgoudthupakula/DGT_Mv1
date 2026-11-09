# New Arrivals page in Price Book

A new Price Book subpage called **New Arrivals** that lists products received for the first time through a delivery, so you can spot them and set/verify their prices.

## What counts as a new arrival

A product appears on this page when its stock row in the database was first created by a delivery. Items are listed newest-first; anything first received within the last **7 days** gets a green "New" badge. Data comes from the existing `item_stock` and `grocery_delivery_lines` tables — no database changes needed.

## What you'll get

**Navigation**
- Price Book gains a "New Arrivals" subpage, placed right after Items.

**New Arrivals page**
- Summary cards: total new arrivals, arrivals this week, total units received, total received value.
- Table with: product name, SKU, barcode, vendor, first received date, units received, cost, current retail, and current stock.
- "New" badge on items received within the last 7 days.
- Search filter (name / SKU / barcode) and a vendor filter.
- Empty state ("No new arrivals yet") when nothing has been received.

## Technical details

- `src/components/pricebook/NewArrivalsPage.tsx` — new page. Fetches `item_stock` ordered by `created_at` desc and the matching earliest `grocery_delivery_lines` + `grocery_deliveries` rows to show first-received date, vendor, and units.
- `src/pages/Index.tsx` — add route under the `pricebook` section.
- `src/components/DashboardHeader.tsx` — add "New Arrivals" entry in the Price Book menu after Items.
- Uses semantic tokens only; consistent with existing table styling (same patterns as Items page).
