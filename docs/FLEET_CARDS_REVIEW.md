# Fleet Cards review

Implemented in test on 2026-09-14. Production Fleet remains unchanged.

Initial inspection: the existing UI had five summary cards, provider/status/reference filters, a batch table and a detail drawer. Preserve these. Six WEX/Voyager/Comdata rows were hardcoded examples. Provider/status/search filtered those examples only; date input was ignored. Export and Settlement Summary had no handlers. There was no creation, settlement entry or reconciliation action. The Vehicle / Account search label does not match its current behavior: it searches provider and batch reference.

Reuse sales, sales_items, sale_payments, tender_types and access_audit_events. Production has no dedicated Fleet tables or vehicle/account fields. sale_payments has processor_reference but this is not a reliable substitute for a fleet provider, account, vehicle or POS batch identity. Do not guess those values.

Proposed workflow: select eligible recorded Fleet payments, assign their provider and a manual batch reference, then record statement discount/fee, actual received amount, settlement date and reference. Open → Settled → Reconciled, admin/manager access, immutable reconciled records and audited edits. Any new schema requires user approval first.

Use fuel line quantities for gallons, excluding voids and subtracting refunds. For receipts with mixed tenders, only attribute gallons where payment-to-fuel allocation is known; otherwise show unknown. Average fuel price must use attributable fuel sales divided by attributable gallons, not merchandise-inclusive fleet payment totals. Do not deduct a POS discount twice: only an additional statement deduction reduces expected settlement. Expected settlement = recorded Fleet payment total - additional statement discount - processor fee. Fees and deposits stay unknown until supplied.

Next implementation includes source-driven filters, CSV, settlement summary and payment/history detail. Processor integrations, vehicle/account identification and automatic Daily Closing linking must remain explicit pending work until their source is available.

## Prepared schema and implementation scope

`Backend/db/proposals/20260914_fleet_settlements.sql` was explicitly approved and applied to test after backup to `Backend/backups/dgt_test_before_fleet.dump`. Test now has 109 tables. Two tables: fleet_batches and fleet_batch_payments. No changes to existing table columns; reuse the current audit table. Provider is saved as a name on each batch, preserving historical labels without adding another provider settings table. WEX, Voyager and Comdata can be suggested names; permit other provider names.

Snapshot signed Fleet payment totals and count distinct receipts. Compute fuel gallons and fuel-only sales once per receipt only when fuel identification and payment allocation are known. If a fuel receipt is paid partly by other tenders, or only some of its Fleet payments are selected, record unknown gallons/fuel sales with an explanation. Do not invent a proportional allocation. Missing invoice/receipt item detail also remains unknown. Refund quantities subtract. Unknown contributions must not silently disappear from summary gallon/average totals.

Manual batch creation, receipt selection, settlement entry/edit and reconciliation use admin/manager store access, transaction locks, idempotency keys and version checks. Reconciled records cannot be edited. Require a reason for any nonzero reconciliation variance. Discounts entered here are additional statement deductions, not discounts already applied at the register. Unknown fees/deposits remain blank. No automatic money movement.

Keep the original page layout. Connect date/provider/status/reference filters; relabel the existing search as Batch / Provider until vehicle/account data exists. Connect Export and Settlement Summary; add Create Batch and per-row Settle/Edit Settlement/Reconcile beside View. Test isolation, refunds, mixed tender ambiguity, duplicate payment selection, settlement validation, reconciliation lock, audit and reload persistence. Apply the prepared schema only after explicit user approval and test backup.

## Implementation and verification

Added FleetController, connected FleetCardsPage and matching creation/settlement/reconciliation dialogs. Feature flag app.tender.fleet.enabled=true is enabled in the test launcher. Existing UI cards, table and drawer preserved. Search is correctly labelled Batch / Provider. Date range, provider/status/reference filters, CSV and settlement summary use saved data.

57 scoped integration tests pass, including Fleet refunds, fuel-only amounts excluding tax, same-store membership, duplicate/replayed creation, concurrent payment claims, receipt deduplication, split-tender ambiguity, missing item detail, gallon-sized merchandise, settlement validation, edits, reconciliation notes, locks and audit. Frontend TypeScript and build pass. Browser create/settle/reconcile workflow passed with preserved sample data.

Four labelled financial-only sample receipts in Store 1, dated August 8, use existing sales/items/payments/tender tables (Backend/db/seeds/20260914_fleet_test.sql). No physical inventory postings and no imported receipt modifications. SAMPLE-FLEET-REVIEW groups a $100 / 25-gallon sale and -$8 / -2-gallon refund: $92 net Fleet sales, 23 gallons, $4 average fuel price. Sample statement fee $1 and additional discount $2 give expected $89; received $88 and reviewed -$1 variance; reconciled. SAMPLE-FLEET-MIXED-BATCH is open with $30 Fleet payment on a $60 mixed Fleet/cash receipt; gallons unknown. The $8 gallon-sized merchandise sample remains unassigned for testing and must contribute zero fuel gallons when batched. Provider names are labelled WEX (Sample) and Voyager (Sample).

Automatic POS/processor imports, vehicle/account attribution and automatic Daily Closing settlement linking remain pending. Current operation records manual confirmations; no funds are moved. Production is unchanged.

Browser persistence, provider/date/reference filters, settlement summary and CSV export also passed after fresh sign-in.
