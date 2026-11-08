# Rebate Claims & Payments connection

Prepared September 14, 2026. Applied to the test database; Claims & Payments is connected on the test site. Production unchanged.

The existing test database contains rebate_programs and rebate_program_items, but no rebate claim or payment tables. The existing Claims & Payments screen uses local sample records. Preserve that screen's layout when connecting it.

## Proposed storage

Migration: Backend/db/proposals/20260914_rebate_claims_payments.sql.

- rebate_claims stores the store/program, claim period, submitted amount, vendor decision, notes and actors. Submission freezes the program definition. A submitted amount is a requested amount, not calculated earnings.
- rebate_claim_payments retains each individual receipt, payment method, date and reference. A UUID prevents a retried payment request from recording the receipt twice.
- Reuse access_audit_events for changes. No changes to inventory, sale prices or bank balances.

## Connection behavior

Store-authorized admin/manager access. All identifiers must belong to the active store. Requests use record versions; decisions and payment recording lock the claim to prevent conflicting updates.

Draft → Submitted → Under Review → Approved or Rejected. Approval records the provider's decision; it does not send anything to the provider. Partial approval is derived when approved amount is below claimed amount. Require a reason for a reduced or rejected amount.

Record payments only against approved claims, up to the unpaid balance. Derive Partially Paid/Paid and outstanding from the sum of receipts. Do not overwrite earlier receipts. Provider credit or invoice deduction is a recorded settlement method here; it must not claim to automatically apply an invoice credit.

Prevent overlapping claim periods for the same program in the service while holding a program lock; the database also prevents exact duplicates. Periods must lie within program dates. Submitted claims cannot be silently edited or deleted. Dates and amount validation run on the server.

Use actual programs/providers for selectors and remove sample records. Keep dialogs open on failed saves. Show earned amounts as unavailable until an earnings calculation is implemented; do not equate claimed amount with earned amount. Document upload remains unavailable until document storage is connected.

## Validation

Test store separation, role checks, persistence, invalid transitions, partial approvals, partial receipts, overpayment rejection, duplicate retries, concurrent writes, date validation and unchanged inventory/bank balances. Verify the existing screen layout and form errors in the browser. Production remains unchanged during this test connection.

Integration checks cover actual claim persistence, access rejection, duplicate/overlapping periods, invalid transitions, stale writes, reduced approvals requiring a reason, partial receipts, overpayment rejection and idempotent payment retries. No automatic provider submission, earnings calculation, bank credit, invoice deduction, document upload or report calculation is performed.

## Production release — September 14, 2026

Released rebate programs/items and claims/payments to the local production environment (frontend 5175, backend 8182, database dgt on 5432). Both rebate migrations were applied after backup to Backend/backups/dgt_before_rebate_release_20260914.dump. Backend artifact and startup: /private/tmp/dgt-rebate-release/. Previous backend and UI retained there for rollback. Production API reads returned 200. Test integration suite: 61 passed; production frontend build passed. No sample test records copied.
