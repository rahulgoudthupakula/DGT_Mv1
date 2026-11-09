# Tender Type Reports — September 14, 2026

Connected in test, preserving the four existing report layouts. No tables or columns added. Production is unchanged.

## Pages and sources

| Page | Source | Connected controls |
| --- | --- | --- |
| Credit Card Batch Log | `credit_card_batches`, `credit_card_processors`, refund snapshots in `credit_card_batch_payments` | Date presets, From/To, processor, status including Submitted, reference search, View, CSV |
| Credit Card Balance Report | Same batches, grouped by processor ID | As-of date, processor, View, CSV |
| Tender Batch Log | `ebt_batches`, `fleet_batches`, refund snapshots in `fleet_batch_payments` | Date presets, From/To, EBT/Fleet, status, reference search, View, CSV |
| Tender Balance Report | Same EBT/fleet batches, grouped by EBT or fleet provider | As-of date, EBT/Fleet, View, CSV |

Reports read saved batches, not all unbatched POS payments. A period without saved batches correctly shows an empty table. Report reads do not create batches or change settlements, stock, closing records or audit records. Customer-account settlements remain unconnected and are not represented by sample values.

## Calculations

- Card net sales are `pos_sales`; gross sales add back the negative payment snapshots shown as refunds. Refunds are not subtracted twice.
- Card expected net = `processor_sales` (or POS net while unsubmitted) − processing fee − chargebacks. Actual fee takes precedence; otherwise the batch's saved expected fee is explicitly identified as estimated. Current settings never recalculate old batch fees.
- EBT net sales = `snap_amount + cash_amount`, already net of refunds. Expected net = net sales + adjustment − fees. SNAP and Cash remain one group because their batch fee and deposit are shared. They are not counted twice or arbitrarily allocated.
- Fleet expected net = `fleet_sales − statement_discount − processor_fee`. Statement discounts are shown separately from fees in the details and export.
- Net Deposit in batch logs is the recorded `received_amount` / `actual_deposit` for settled or reconciled batches. Open/submitted batches have no recorded deposit. Card receipts include both bank deposits and jobber credits; the drawer identifies the destination.
- Balance reports include batches with business date on/before the as-of date. Deposits count only when their settlement date is also on/before that date. Unsettled expected amounts remain pending. Variance = received − expected for settled batches; a settled shortage is variance, not an additional pending deposit.
- Unknown EBT/fleet fees or discounts leave expected/pending amounts unavailable, including affected group totals. Missing amounts are not silently treated as zero. Recorded deposits still total normally.
- Money totals accumulate integer cents. CSV includes the adjustments, settlement metadata and estimate flags needed to explain displayed totals; formula-like text is escaped.

As-of reports use the latest saved fees and corrections for the selected batches. They do not reconstruct an immutable historical audit snapshot. This limitation is displayed in the UI.

## Access and dates

`GET /api/v1/access/stores/{store}/tender-reports?family=card|tender` accepts either inclusive `start`/`end` (maximum 366 days) or `asOf`. Logs default to the latest batch month through the latest batch date; balances default to today in the store timezone. Future dates, reversed ranges and conflicting period/as-of parameters are rejected.

Only company admins and active managers assigned to the selected store can read the endpoint. Queries scope every batch/processor to that store and run in a read-only repeatable-read transaction. The Reports navigation now enables normal interaction for authorized users instead of the old disabled preview.

## Verification

- 64 backend integration tests passed, including report authorization, cross-store isolation, dates, saved refund snapshots, mixed EBT amounts, fleet discounts and no mutations during reads.
- Six calculation/export tests passed, covering double-counting, settlement-date boundaries, pending versus variance, unknown fees, group identity and CSV safety.
- TypeScript and frontend build passed.
- Test browser checked all four tabs with empty and populated tables, date filters, Submitted status, EBT filtering, all four detail drawers and CSV exports. Also checked before/after settlement balances and rejection of a reversed range without stale totals.
- Three explicitly identified temporary UI-test batches and their temporary processor were removed after verification. No sample stock or sales were changed.

## Production release — September 14, 2026

Released the tested backend and UI to the existing production services on ports 8182 and 5175. All four report tabs, date filters and exports passed production browser checks. No schema changes or test data copied. Rollback artifacts are retained in `/private/tmp/dgt-tender-reports-release`.
