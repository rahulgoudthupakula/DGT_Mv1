# Upload an invoice, get the items in stock

Upload a PDF or photo of a vendor invoice in Grocery → Edit & View Invoices → New Invoice. The items on it are read automatically, you review them, and saving updates your stock.

## How it works for you

1. **Upload** the invoice file (PDF, JPG or PNG).
2. **Reading** — a short "reading your invoice" step while the file is scanned.
3. **Review** — a table appears pre-filled with vendor, invoice number, invoice date and every product line found: product name, code, quantity, unit (item/case), unit cost and line total. Every field is editable, lines can be added or removed, and totals update live.
   - Lines that match a product you already sell show the matched product.
   - Lines with no match are marked **New product** and will be created.
4. **Save** — creates a Delivery record (visible on the Grocery → Delivery page with its product lines) and adds the received quantities to stock, so Items, Bulk Update and Inventory Valuation update right away.
5. **New products** created this way appear on Price Book → New Arrivals with the "Needs category" flag, so you set their department, sub-department and retail price there.

If the file can't be read, you get a clear message and can switch to entering the invoice by hand — the existing manual path stays as it is.

## Technical details

- New edge function `parse-invoice`: accepts the uploaded file as base64, calls the Lovable AI Gateway (`google/gemini-3.7-flash`, chat completions with an `image_url` block for images and a `file` block for PDFs) with a strict JSON schema — vendor, invoice_number, invoice_date, currency, lines[{ description, sku/barcode, quantity, unit_type, units_per_case, unit_cost, line_total }]. Handles gateway 429/402 with the documented user-facing messages; no key in client code.
- `OrdersInvoices.tsx`: replace the mocked `upload → processing → review` steps with a real file input, base64 upload to the function, and a fully editable review table backed by the parsed result. Keep the `manual` path untouched.
- Matching: each parsed line is matched against `pricebookItems` by barcode, then SKU, then normalised name; unmatched lines get a generated SKU and are flagged new.
- Saving reuses the delivery posting logic already used by `AddDeliveryDialog.tsx`: insert into `grocery_deliveries` + `grocery_delivery_lines`, then call the `adjust_item_stock` RPC per line (quantity × units_per_case for case lines). No schema change needed — new products land in `item_stock`, which is what New Arrivals already reads.
- Extract the delivery-posting helper out of `AddDeliveryDialog.tsx` into `src/lib/postDelivery.ts` so both paths share it.
