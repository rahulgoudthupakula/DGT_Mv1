# Credit Card connection — implementation contract

Scope: existing Credit Card Settings, Settlement and Update Batch Fee layouts, test first. EBT/Fleet/Customer Accounts and their reports remain later steps. No payment execution or bank transfer occurs here.

## Data

Reuse sales, sales_items, sale_payments, tender_types and access_audit_events. Four proposed tables cover store settings, processors, batches and exact receipt-payment membership. A payment cannot belong to two batches; a database trigger checks same-store membership. Processor names are unique per store. Settings and processor destinations are snapshotted on batches so later edits cannot rewrite historical fees. Production is untouched.

The imported workbook has card payments, but no genuine POS batch IDs or processor assignment. Users must choose the processor and eligible payments and supply a batch reference. Label these groups as manual; do not silently manufacture POS batch IDs or assign every card payment to a processor. Credits/debits are selectable; generic mobile pay is not assumed to be card payment.

## Calculations

- POS total: signed sum of selected completed card payments; refund payments subtract. Voids/open receipts excluded. Use store-local business date.
- Expected fee: positive sale-payment fee base × configured percentage / 100 + configured per-transaction fee × eligible completed sale payment count; round the batch result once to cents. Refund fee policy is not inferred. Actual statement fees remain authoritative.
- Processor net: processor reported sales − actual fees − separately reported chargebacks. Processor sales must be entered before separate chargeback deductions (avoid deducting the same chargeback twice).
- Deposit difference: actual amount received − processor net. Also retain the separate difference between processor sales and recorded POS sales; never combine those two comparisons into one unexplained variance.
- Fee difference: actual − expected. A reason is required when the absolute difference exceeds the configured percentage of the fee base; any nonzero difference requires a reason if the base is zero.

## Lifecycle and permissions

Admin/manager-only initial scope, enforced per store on the server. Settings and processor mutations use version checks. Creates use idempotency keys; batch membership and state transitions are transactional. Audit records include previous/new values and actor.

Open → Submitted after recording processor totals → Settled only after recording received amount, date, reference and actual fees → Reconciled after required fee/variance review. Status does not advance merely because time elapsed. Reconciled batches are locked. Fee edits recalculate the display; no stale net/variance totals. No bulk settlement without explicit selected batch records and matching received details.

Keep existing settings tabs and fields. POS sync automation, processor file import formats, automatic time-based settlement, monthly-fee allocation and configurable role delegation must not appear enabled until their source/workflow is implemented. Standardize import format only after a supported processor statement format is known. Reuse actual audit events in the settings Audit tab.

## Daily Closing

Existing closing statement totals remain independently recorded and closed reports immutable. Do not silently add batch totals on top of existing closing entries; future linking must explicitly replace/allocate corresponding statement totals without duplication.

## Verification

Test store isolation, inactive processors, duplicate membership and concurrent batch creation, invalid amounts, rate snapshots, refund handling, fee tolerance reasons, missing settlement details, lifecycle ordering, reconciled locks, optimistic conflicts and audit persistence. Browser-check the original layouts, save/reload, filters and CSV export. No test data copied to production.

## Implementation result

Implemented and enabled in the test runtime on September 13, 2026. The approved four-table migration is applied to dgt_test (105 tables). All 55 scoped integration tests, app TypeScript and frontend build pass. Browser smoke checks verified existing tabs/dialogs and actual eligible card payments. Production is unchanged. Browser save/reload and concurrent-request stress testing have not been performed; API tests verify persistence, version conflicts and duplicate membership.
