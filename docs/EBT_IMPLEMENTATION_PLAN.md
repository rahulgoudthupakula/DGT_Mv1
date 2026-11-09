# EBT connection plan

Status: implemented in test on 2026-09-13 (migration filename 20260914). Production unchanged.

Keep the existing cards, filters, table and detail drawer. Replace mock rows with store-scoped data. Admins and assigned managers manage batches; enforce access on the backend.

Sample transactions need no new tables or columns. Use existing tender_types entries EBT_SNAP and EBT_CASH and existing sales/payment/item tables, with clearly labelled SAMPLE-EBT receipt references. Do not relabel imported workbook transactions or overwrite their original dates. Keep test fixtures separate from imported receipts. Sample amounts affect test sales reports; do not copy them into production.

Settlement persistence needs two proposed tables in Backend/db/proposals/20260914_ebt_settlements.sql: ebt_batches for settlement records and ebt_batch_payments for exact payment membership. Reuse access_audit_events. No new settings or processor tables. User approved and migration applied after backup to Backend/backups/dgt_test_before_ebt.dump. Test database now has 107 tables.

Create manual batches from selected completed EBT payments for a store-local date. Do not invent POS batch IDs. Prevent duplicate membership and cross-store selection. Preserve payment and benefit-type snapshots; use idempotency keys and version checks for writes. Distinct sale IDs determine transaction counts.

SNAP and cash amounts are signed totals: refunds already subtract. Show the refund amount separately as information, never subtract it twice. Expected deposit = SNAP net + EBT Cash net + signed statement adjustment - recorded fee. Fees stay unknown until entered; do not assume a rate. Variance = actual deposit - expected deposit, unknown before settlement. Any nonzero variance needs a review note before reconciliation.

Open → Settled requires fees, actual deposit, settlement date and reference. Reconciled requires explicit review; then lock the record. Audit before/after values and actor. Settlement records do not execute transfers or modify Daily Closing automatically.

Connect dates, benefit-type/status/reference filters, CSV export and Settlement Summary to saved records. Type filtering selects matching batches; mixed batches retain their full amounts so reconciliation totals remain consistent. Label this clearly.

Verify refunds, split payments, store isolation, duplicate submission/membership, incomplete settlement, variance review, reconciliation locks, audit and filter/export behavior. Browser-check the preserved layout. Automatic POS/processor import and Daily Closing linkage remain separate work.

## Test samples and verification

Seed script: Backend/db/seeds/20260914_ebt_test.sql. Six labelled Store 1 receipts dated August 7, 2026 use existing sales/payment/item/tender tables. Four completed sale/refund receipts contribute SNAP net $50 and EBT Cash $30; void and open receipts are excluded. These are financial tender fixtures, not physical inventory postings. Original May 1–August 6 workbook receipts remain unchanged. No samples are copied to production.

Browser workflow created SAMPLE-EBT-REVIEW (SNAP net $50, cash $10, fees $1, adjustment +$2, expected $61, received $60, reviewed variance -$1; reconciled) and SAMPLE-EBT-OPEN-BATCH (cash $20; open). The statement amounts are explicitly sample values. The open batch is available for user testing.

Supported: manual grouping; exact payment membership; SNAP/cash filtering including net-zero batches; settlement create/edit; explicit reconciliation; locked reconciled batches; notes and audit history; date/reference/status filters; CSV and summary. Unknown fees/deposits/variance remain blank. Distinct receipt counts avoid double-counting split payments across batches. No automatic bank transfers, POS imports or Daily Closing settlement linking.

Validation completed: 56 integration tests, TypeScript and frontend build passed. Browser creation, settlement, reconciliation, variance-note enforcement, fresh-login persistence, detail/audit, type/date/reference filters and CSV export passed. Test UI 5173 and backend 8181 are enabled with app.tender.ebt.enabled=true.
