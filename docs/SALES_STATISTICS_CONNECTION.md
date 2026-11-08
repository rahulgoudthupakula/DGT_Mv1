# Grocery Dashboard and Price Book Statistics — September 14, 2026

Connected in test using the existing layouts. No database tables/columns added, no stock changes and no new sample sales. Tender Reports was released first; these two statistics pages have not been released to production.

## Summary response optimization — October 12, 2026

The same GET endpoint now returns `schemaVersion: 2`, `storeId`, the existing date/timezone metadata, and `stats`. Individual `rows` are no longer returned. Deploy the backend and frontend together; the frontend checks the response version and displays an error if it receives the old format.

PostgreSQL aggregates recorded sales in `Backend/src/main/resources/reports/sales-statistics.sql`. `stats` contains current/prior merchandise totals, daily and hourly series, category totals, top-five items (ID, name, category, quantity, revenue and rank), and the fuel/merchandise mix used by Price Book Statistics. The frontend retains display colors, formatting and percentage-change presentation. The dashboard layout, store authorization, date rules, refunds and recorded selling units are preserved. No database migration or inventory write is involved.

Validation for this change:

- Local temporary-table SQL fixtures: refunds, discounts, fractional quantities, distinct receipts, timezone boundaries, prior period, fuel/lottery separation, void exclusion, empty results and store isolation. Run `python3 Backend/scripts/tests/sales_statistics.py` with local Docker running; `DOCKER` and `DGT_TEST_CONTAINER` can override local defaults. Fixtures run in a rolled-back transaction and use temporary tables.
- Compared the new query to the previous browser calculations for 277 local sales-item rows: totals, quantities, chart series and top items matched; percentage ratios matched within 1e-12. Compact response data decreased from 66,300 bytes to 4,925 bytes for the summary alone (metadata adds a small overhead).
- Backend compilation including test sources, frontend production build, TypeScript checking and the two summary presentation tests passed. The full authenticated integration suite was not run as part of this change.
- These are local changes; production deployment is separate.

## Source and access

Both pages use `GET /api/v1/access/stores/{store}/sales-statistics?start=YYYY-MM-DD&end=YYYY-MM-DD`. It reads `sales`, `sales_items`, `products`, `pos_terminals`, `store_sub_departments` and `store_departments` for the selected store. It uses the existing Price Book access rule: company admins and authorized active managers. Related items and terminals must belong to that store.

Only completed sales and completed/refunded return/refund receipts count. Voids, suspended/incomplete sales and other non-sale events are excluded. Amounts come from recorded sale lines; current selling prices and item costs do not replace them. Department/sub-department labels reflect current item assignments, as in existing reports.

Dates use the store timezone, including midnight boundaries. Default selection is the latest recorded activity date and the preceding 13 days. Explicit ranges are inclusive, up to 366 days, with no future dates. The endpoint also reads the immediately preceding equal-length period for comparison, in one read-only repeatable-read transaction.

## Grocery → Dashboard

- Total Sales = merchandise line gross minus recorded discounts, less net refunds, excluding sales tax.
- Existing department rules classify Gas/Fuel as fuel and Lottery-prefixed departments as non-merchandise. Remaining departments form merchandise, consistent with current reports.
- Total Transactions counts distinct completed purchase receipts containing merchandise. Multiple lines and split tenders do not duplicate receipts; refunds reduce money/quantity without increasing the purchase count.
- Average Transaction = net merchandise sales / completed merchandise purchase count. No purchases means unavailable.
- Items Sold sums signed quantities in their recorded selling units; cases are not guessed or converted.
- Comparisons use the preceding equal-length period. A missing/zero/negative baseline shows no comparable value instead of an invented growth percentage.
- Daily sales covers every selected calendar day, including zero-sales days. Hourly sales sums each store-local hour across the selected period.
- Category chart uses sub-departments. Top five items rank by net quantity, then net revenue; returned quantities reduce rankings.
- The existing calendar selectors and Apply Filter button work. The applied range is displayed so draft date selections are not confused with displayed totals.

## Price Book → Statistics

- Merchandise, non-merchandise, fuel dollars, percentages and overall mix share the same recorded lines and net-sales formulas.
- Non-merchandise currently means recorded lottery sales under the existing department convention. Financial-service activity is not inferred from payments or added to sales.
- Fuel series/cards come from sold Gas/Fuel product IDs and names. No fixed four-grade sample list or price-based grade guess remains. Duplicate product names do not merge distinct products. This does not invent a link to the separate Gas Settings grade catalog.
- Percentages use net category sales / net total sales. Zero or negative net totals make percentage values unavailable. Pie charts are withheld when category net refunds would make the mix misleading; dollar charts retain negative values.
- Date selection refreshes this page automatically. Empty/error/loading states do not show invented or stale figures. Currency axes handle small dollar values, and date/category labels stay readable with actual data.

## Verification

- 65 backend integration tests passed, including authorization, store isolation, date validation, timezone boundaries, comparison periods, saved discounts/refunds and no inventory movements during reads.
- Six statistics calculation tests passed: distinct receipts, refunds, prior periods, fuel/lottery exclusion, dynamic fuel products, unknown percentages, negative mixes, money rounding and out-of-range records.
- TypeScript check and frontend build passed.
- Browser: both pages, normal calendar interaction, May 1–August 6, matching merchandise total of $15,558.63 in test Store 1, charts, reversed dates and an empty September 1 range. Final chart layouts were visually checked.

## Production release — September 14, 2026

Released the verified backend and production UI to the existing services on ports 8182 and 5175. Browser checks passed for Grocery Dashboard, Price Book Statistics, calendar filtering and matching merchandise totals for May 1–August 6. Production had no merchandise sales in that selection and both pages correctly showed zero/empty states. Test sample sales were not copied and no schema changes were applied. Rollback artifacts are retained in `/private/tmp/dgt-statistics-release`.
