# Deliveries that update real stock

Deliveries become real records saved in the backend. When a delivery is posted, the quantities received are added to each product's stock, and the Items list and Bulk Update list both show the updated numbers.

## What you'll get

**Add Delivery form**
- Vendor, invoice number, delivery date, status.
- Product lines: pick a product (search by name/SKU/barcode), enter quantity received, unit (item or case), and unit cost. Add or remove lines freely.
- Running totals for line count, total units, and total cost.
- Saving posts the delivery and immediately increases stock for each product on it.

**Delivery list**
- Shows saved deliveries from the database instead of samples, with the existing filters (date range, vendor, status, search).
- Each delivery can be opened to see its product lines.

**Stock updates**
- Items page "Current Inventory" and Bulk Update "Current Inventory" both read the shared stock values, so a posted delivery is visible on both pages right away and after a refresh.

## Notes

Stock goes up on delivery (receiving). If a delivery is deleted, its quantities are reversed.

## Technical details

New tables (public schema, same open-access policy pattern as `store_transfers`, with GRANTs and RLS):
- `grocery_deliveries` — vendor, invoice, delivery_date, status, notes, totals.
- `grocery_delivery_lines` — delivery_id, sku, barcode, item_name, quantity, unit_type, unit_cost, line_total.
- `item_stock` — sku (unique), item_name, quantity_on_hand. Seeded from the current mock inventory values so existing numbers stay intact.

Implementation:
- `src/hooks/useItemStock.ts` — fetches `item_stock` into a `sku -> quantity` map with realtime subscription.
- `AddDeliveryDialog.tsx` in `src/components/grocery/` — form + line editor, uses the pricebook item list for product lookup.
- Posting a delivery inserts the header and lines, then upserts `item_stock` quantities (quantity added per line, cases multiplied by case size where the item is case-based).
- `GroceryDeliveryPage.tsx` — replaces sample data with a Supabase query, adds row expansion for lines and delete-with-reversal.
- `ItemsPage.tsx` and `BulkUpdatePage.tsx` — `currentInventory` displayed from the shared stock map (falling back to the existing mock value when no row exists yet).
