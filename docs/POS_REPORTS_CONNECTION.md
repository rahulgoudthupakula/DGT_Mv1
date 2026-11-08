# POS Report connection — September 14, 2026

Connected in the test environment. No database migrations, stock changes, new sample records or production release were performed for this task. Net Worth, Expenses CPA and Other Income CPA are outside this implementation.

## Data and access

`GET /api/v1/access/stores/{store}/pos-reports?start=YYYY-MM-DD&end=YYYY-MM-DD` reads the selected store's sales, sale lines, payments and daily closing. Company admins and assigned active managers can access it; cashiers, accountants and other-company users cannot. Related products and terminals must belong to the same store.

Dates are inclusive in the store timezone, with a maximum 366-day range. The default is the latest recorded sale date through today. All report tabs use the same range; the Z-Report uses its ending date. Read-only repeatable-read queries keep each response internally consistent.

## Connected views

- **Department Sales:** summary, date, weekday and month breakdowns. Merchandise views exclude fuel and lottery. Sales-only gross less recorded discounts and net completed refunds equals net sales. Promotion discounts are not separated from the recorded total discount.
- **Gas Sales:** fuel product/grade totals and date, weekday, month and hourly breakdowns. Gallons require an explicit gallon selling unit; unknown units show unavailable instead of an invented conversion. Average price uses net sales / net gallons. Hourly average sales uses calendar days in the selected range; transactions count distinct receipts.
- **Item Sales:** item identity, department, net quantity, pre-tax net sales and weighted average selling price. Quantities retain the item's selling unit.
- **Item Sales by Date/Hour:** distinct receipts, net quantities and net sales grouped in store-local time.
- **Fuel Sales by CC:** fuel line totals for receipts with one tender/brand only. Mixed-brand/tender or missing-payment receipts are counted as excluded. Fuel line amounts exclude tax; they are not processor settlement amounts.
- **Tax Sales Report:** actual taxable amounts and tax collected by department. Displayed rates are effective ratios, not configured tax rules or jurisdiction allocations. Fuel excise tax is not inferred.
- **Item Sales History:** selected-period net quantity, latest completed sale price/date, item identity and department. A later refund does not replace the last sale price/date. Historical cost and sale-to-vendor attribution remain unavailable.
- **Z-Report:** uses the saved snapshot for a closed business day and the existing daily-closing read for an open/draft day. Connects merchandise, fuel, lottery, tenders, recorded tax, opening/expected/counted cash and cash variance. Sample closing records are labelled. Older saved snapshots without Deli detail show that component as unavailable while retaining the saved merchandise total.
- **Print/PDF/CSV:** print uses the browser dialog, including Save as PDF. CSV exports the displayed report table; Z-Report CSV includes its tables. Spreadsheet formula prefixes are escaped.

## Unavailable fields

- Realized profit, historical COGS and margins require sale-time costs. Current product cost is never substituted.
- Scanned-item profit and manual ring-ups require an explicit POS entry-method marker. Missing barcodes do not prove manual entry.
- A POS-issued Z number, authoritative close timestamp and processor batch-to-closing links are not inferred from daily-closing IDs.
- Separate promotion attribution, tax jurisdiction breakdown and mixed-tender fuel allocation require more detailed source records.

## Verification

- Backend scoped-access suite: 63 passing tests, including store isolation, manager access, forbidden roles, date validation, midnight boundary, refunds and no closing writes during report reads.
- Calculation tests: refunds, repeated lines on one receipt, tax totals, unknown historical costs, split tenders, missing gallon units, date grouping and latest sale versus refund history.
- Frontend build and TypeScript checks.
- Test browser: ten main tabs and eleven breakdown selections; May 1–August 6 date range; downloaded item CSV checked; Z-Report layout visually inspected.

## Production release — September 14, 2026

Released the tested backend and production frontend to ports 8182 and 5175. Previous artifacts are retained in `/private/tmp/dgt-pos-reports-release` for rollback. No schema migrations or test-data imports were applied. Production browser verification passed for all ten tabs with May 1–August 6 selected and no report errors.
