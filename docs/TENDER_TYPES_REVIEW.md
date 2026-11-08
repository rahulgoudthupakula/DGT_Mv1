# Tender Types inspection — 2026-09-13

Inspection only; tender workflows have not been connected in this change.

| Area | Current behavior | Work needed |
| --- | --- | --- |
| Dashboard | Navigation entry without a dedicated tender dashboard component | Store-scoped overview |
| Credit Card Settlement | Hardcoded sample batches, in-memory filters/detail dialogs | Recorded payment totals, processor batches, fees, settlement destinations, status transitions and audit |
| Update Batch Fee | Sample rows; Save and Save & Recalculate only dismiss the dialog | Persist actual fees/reasons and recalculate net settlement/variance |
| Credit Card Settings | Sample processor accounts and uncontrolled form inputs | Persist store processor configuration and fee rules |
| EBT/Foodstamps | Sample batch rows and detail view | Recorded EBT payments and separate settlement reconciliation |
| Fleet Cards | Sample provider batches and gallons | Store-scoped fleet receipts, supported gallon attribution and settlement records |
| Customer Accounts | Sample customers, aging balances and transaction history | Customer account ledger and payment/allocation workflow |
| Reports | Four sample-data batch/balance reports | Shared real batch/ledger sources, working date filters and exports |

Existing sources: `tender_types` defines payment codes; `sales`, `sales_items` and `sale_payments` hold recorded receipts/payments. `daily_closing_tenders` stores closing summaries. `everyday_closing` has the recently connected jobber/bank statement totals, not detailed processor batches. `daily_closing_deposits` stores deposit records. The inspected schema has no dedicated processor configuration, settlement batch/fee or customer receivable ledger tables. Do not present tender payments as bank settlement confirmations or infer actual POS batch IDs from dates.

Suggested implementation order: Credit Card Settings and Settlement, Batch Fee editing, EBT/Fleet, then reports. Customer Accounts is a separate ledger workflow. Keep current layouts and store isolation. Prepare any needed schema additions for approval before applying them.

Financial and Payment Services and Banking Management are now paused in desktop/mobile navigation and navigation handlers; restored saved routes return to Home. This is navigation availability, not deletion of their data or an API authorization change.
