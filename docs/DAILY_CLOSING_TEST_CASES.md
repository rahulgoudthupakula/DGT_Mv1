# Daily Closing test data

Test UI: http://localhost:5173 → Everyday Closing Reports → Store or Reports.

Coverage: every date from **May 1 through August 6, 2026**, for Store1 and Store2 (98 days each). Use the month/date controls to select May, June, July or August; report date ranges currently support up to 31 days per request.

Store1 uses the original imported sales. Store2 deliberately has no imported sales, so it covers cash handling on days without recorded sales. Sample cash does not create sales, payments, bank settlements or inventory movements. Normal opening float is $100 for Store1 and $150 for Store2, with opening-count differences on the 2nd and 5th of each month. All sample cash records are labelled.

## Example cases in each store

| Date | Scenario | What to check |
|---|---|---|
| May 1 | Balanced, draft | Save Draft; counted cash equals expected cash |
| May 2 | No cash movements | Opening float plus net cash payments only |
| May 3 | Added cash | Cash added increases expected cash |
| May 4 | Cash payout, draft | Payout reduces expected cash |
| May 5 | Cash drop | Drawer-to-safe drop reduces drawer cash |
| May 6 | Added cash, payout and drop | All three movements reconcile together |
| May 7 | Small shortage, draft | Over/short is -$0.75 |
| May 8 | Small overage | Over/short is +$1.25 |
| May 9 | Large shortage | Over/short is -$25 |
| May 10 | Large overage, draft | Over/short is +$30 |
| May 11 | Empty closing drawer | All available cash dropped; expected and counted cash are $0 |
| May 12 | Keep normal float | Cash movements leave the normal $100/$150 float |

These scenarios repeat across the period with deterministic varied amounts. Existing August 1–6 records and any already-saved days are preserved. Later manual edits may change these expected sample results.

## Calculation

Expected drawer cash = opening cash + net CASH payments + cash added − cash payouts − cash drops.

Over/short = counted closing cash − expected drawer cash.

Tax is already included in recorded sales. Opening cash is not revenue. Cash drops are not bank deposits. Non-cash tenders must not increase expected drawer cash.

## Validation and workflow checks

- Saving a draft persists amounts; closing freezes its sales/payment snapshot.
- Closed records reject further edits; editing drafts does not change historical sales.
- Negative amounts, excess payouts/drops, more than two decimal places and future business dates are rejected.
- Stale record versions and changed sales/payment sources require reload and review.
- Changing stores must not show the other store's sales or float.
- Month totals and exports must agree with daily rows, including negative over/short.
- Existing integration tests cover refunds, access denial, store isolation and closed snapshot preservation. Invalid requests are tested without retaining invalid records.

No-sale, voided-line and suspended-transaction event support remains pending; these cash examples do not create those missing transaction events. This is broad cash-flow test coverage, not a claim that every possible POS scenario is implemented.

## Repeatability

`Backend/scripts/imports/seed_daily_closing_test.py` targets test backend8181 and reads `DGT_TEST_ADMIN_PASSWORD`. It preserves existing days rather than overwriting them. Backup before expansion: `Backend/backups/dgt_test_before_full_period_cash.dump`.

## Reconciliation fields (2026-09-13)

Open an existing draft such as Store 1, August 6. Grocery/cigarette/fuel breakdowns and EBT/fleet payment totals are read from recorded transactions. Open each original accordion to inspect them. The older CLOSED samples retain their original snapshots and cannot acquire new breakdowns retroactively.

- Enter counted opening/closing checks; Total Opening/Closing Amount adds them to cash.
- Enter cash purchases and pending-invoice payments separately from Cash Expenses. They reduce drawer expected cash once; they do not edit invoice payment status.
- Use the eye beside Total Deposits to enter cash/check deposits directly from this drawer. Do not enter safe money already recorded under Cash Drops a second time.
- Enter actual jobber and bank settlement amounts in the two card accordions. They are statement amounts, not automatically inferred from payment totals.
- Enter daily lottery statement fields including its reported Balance. They persist without generating additional sales.
- Save Draft, reload, and verify entries. Close Day locks them and freezes the breakdown and reconciliation snapshot.
- A new report for the immediately next day carries the closed cash/check balances. A missing or draft predecessor uses the store cash default and leaves checks unknown. Existing draft opening balances are preserved.
- Check deposits cannot exceed opening checks plus net check payments. Negative purchases/deposits and values with more than two decimal places are rejected. Refund/credit statement amounts may be negative.
- Zero EBT/fleet amount means no matching recorded payments in that date/store, not a claim that a processor settled funds. Mixed-payment fuel receipts cannot yield an exact fleet gallon attribution and display an explanatory message.

Automated integration coverage uses isolated temporary stores and removes its records. The original 196 sample cash reports and workbook sales remain in place.
