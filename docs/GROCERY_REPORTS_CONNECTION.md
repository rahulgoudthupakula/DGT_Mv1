# Grocery reports connection

Implemented against the test database on September 14, 2026. Existing report layouts and navigation are retained. No tables, columns, migrations or production data were changed.

## Sources and calculations

All three read-only endpoints are under `/api/v1/access/stores/{store}/grocery-reports`. They enforce the selected store and the existing Price Book permission; cashiers and users outside the store cannot access the data.

| Report | Connected data and rules |
| --- | --- |
| Sales | `/sales`: completed sales less completed/refunded returns, from `sales` and `sales_items`. Net sales exclude tax and deduct line discounts. Store-local dates and a preceding equal-length period support date filtering and sales velocity comparisons. Fuel departments are excluded. |
| Deli Sales | The same sales source, restricted to the Deli department. |
| Profit | Actual net sales, quantities and average selling prices are connected. COGS, profit, margin and profit trends remain unavailable until sale-time costs are recorded. Today's costs are never substituted. |
| Purchase Invoice Summary | `/purchases`: approved grocery invoices only. Line totals plus line tax and freight/fuel/handling charges, less the invoice-level discount. Payment status comes from the saved invoice charge status. Paid/unpaid totals can be derived for fully paid/unpaid invoices; partial payment amounts and cash/check/EFT/bank allocation remain unavailable without payment records. |
| Single Item Purchase History | Approved invoice lines, vendor, barcode, sub-department, received quantity, cost and previous purchase cost. Case quantities and case costs convert to individual units. Extended/net line cost uses the saved invoice line total; unallocated header discounts and rebates are not invented. Previous purchase lookup includes records before the selected date range. |
| Inventory Valuation | `/stock`: recorded available quantity multiplied by current item unit cost or effective selling price, including active price-group pricing. Missing quantity/cost/price makes the affected value unavailable. Category totals use the same rule. |
| Cigarette Inventory | Cigarette department items, explicit pack/carton units, approved purchases, recorded sales and inventory movements. Date balances are reconstructed from the recorded movement ledger. Historical imported sales were not replayed into inventory; these balances are not physical stock counts. |
| Key Ratios | Net sales / approved purchase line totals and current inventory cost / retail value. Zero denominators return unavailable. No target ranges are assumed. Capital weight is the category’s share of total inventory cost; no hard-coded high-cost warning threshold is applied. Future-dated invoices are excluded from the sales/purchase ratio. From/To controls apply the same inclusive range to both sources; All dates resets the filters. Unsupported target-range labels are removed. |

## Data-dependent sections

- Historical sale costs: required for realized profit, COGS, margins and margin impact. The user explicitly chose to wait for this data.
- Historical inventory cost/retail snapshots: required for valuation by date.
- Physical counts: required for actual-versus-recorded inventory comparisons.
- Payment ledger and allocations: required for partial payment amounts and payment-method breakdowns. The report does not create payments.
- Item-level rebate/adjustment attribution and uninvoiced receipts: required for adjusted-purchase and rebate-impact measures.
- Sales item drawer: daily sales are connected; price-change history, vendor details and movements are explicitly marked as not included in this view.
- Sage300: removed from Grocery Reports at the user’s request.

## Validation

- Backend scoped-access integration suite: 62 tests passed, including report authorization, store isolation, approved-only invoice inclusion, case conversion, date validation, store-local sale dates and discounted refunds.
- Frontend production build and TypeScript check passed.
- Local test-browser checks covered eight connected report tabs and ten inner views using normal mouse interaction. Verified that the reports page is enabled, preserves its layout and opens the selected approved invoice from View Invoice.

## Production release — September 14, 2026

Released the tested backend and production frontend to the existing local production services (backend 8182, UI 5175). No schema migrations or test data imports were applied. The previous backend and UI are retained under `/private/tmp/dgt-grocery-reports-release` for rollback.

Production browser verification passed for all eight report tabs, Sage300 removal, identical May 1–August 6 date parameters for sales and purchases, reversed-range validation and All dates reset.
