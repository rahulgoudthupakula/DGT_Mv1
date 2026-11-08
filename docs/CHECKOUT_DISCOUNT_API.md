# Open-sale discount application

Released to production September 14, 2026. Backend health, settings, checkout options and approval queue verified; updated frontend served on 5175. No sample discount records were copied to production. Validation before release: 60 integration tests, builds, TypeScript and test-browser checks passed.

Backup: Backend/backups/dgt_before_checkout_discounts.dump. Backend: /private/tmp/dgt-checkout-release/backend.jar. Previous backend: /private/tmp/dgt-discount-release/backend.jar. Previous UI: /private/tmp/dgt-checkout-release/previous-ui.

## Setup

Price Book → Discounts now includes Eligibility check (None, Active store employee, Student ID checked, Senior age confirmed, Military/veteran ID checked). Senior discounts require a configured minimum age. Configure this explicitly; an existing discount named Employee is not automatically classified by its name.

Cashiers visually check ID/age eligibility and submit a confirmation. No identity document photos, numbers or birth dates are stored. Employee eligibility uses active store assignments and employment dates, including employees without website accounts. A request records authenticated confirmation actor/time, recipient employee where relevant, the rule revision and calculation snapshot.

## Endpoints

All routes start with `/api/v1/access/stores/{store}/checkout-discounts` and require authentication. Assigned cashiers may operate only their own open sales. Store Price Book managers/admins may operate and review store sales. Accountants and users from other stores are denied.

- `GET /options`: active discount eligibility settings and active employee selections.
- `POST /preview`: calculate without modifying sale totals.
- `POST /`: calculate and apply, or create a pending approval. Requires UUID `Idempotency-Key` header.
- `GET /requests`: manager/admin pending queue, also shown under Discounts Given → Pending Approvals.
- `POST /{id}/approve`: authenticated manager/admin approval. Requester and employee recipient cannot approve. Rechecks current eligibility, active settings, daily cap and the saved ticket/rule snapshot. Changed tickets, rules or business date require rejection and a fresh request.
- `POST /{id}/reject`: manager/admin rejection, or requester cancellation. No sale quantity or amount changes.

Preview/apply body example:

```json
{
  "saleId": 123,
  "discountId": 7,
  "itemIds": [],
  "eligibilityConfirmed": true,
  "employeeId": null
}
```

Whole Ticket uses all eligible lines automatically; Single Item requires exactly one sale-line ID. For Employee eligibility supply the selected employee ID. POST returns an application ID and PENDING or APPLIED. Repeating the same request/key returns its existing result; reusing the key with different details is rejected.

## Calculations and boundaries

- Only OPEN SALE records with no payment records are accepted. Completed, refunded, voided or tendered sales are rejected. No past sales are rewritten.
- Header and line totals must agree. Positive-quantity lines only. Price-book settings and existing sale-line monetary values are authoritative; the request cannot supply discount amounts, cashier names or approver IDs.
- Percentage applies to eligible net value; amount-off is capped at eligible net value. Cent allocation across lines is exact. Excluded restricted/fuel lines are skipped for whole tickets and rejected for single-item requests.
- Fuel classification uses gallon units or Gas/Fuel/Gasoline/Diesel department names. A future POS adapter must map its products consistently; no pump integration is provided.
- Existing line discounts are treated conservatively as discounts/promotions. Combining must be explicitly enabled. One standalone register discount per sale is supported; multiple standalone discounts are rejected.
- Tax is recalculated proportionally from each existing line's effective tax. Partial taxable bases and unsupported tax layouts are rejected. This does not implement a jurisdictional tax engine; the POS adapter must validate tax semantics before production use.
- Store business-day cap sums APPLIED amounts for that discount. Pending requests do not consume it, but approval rechecks it under a store lock. The cap is not automatically restored on refunds or voids in this version.
- Applying updates sales_items discount/taxable/tax/total, sales aggregate totals, and sale_discount_applications atomically. It does not update payments or inventory. Existing recorded unit price remains the pre-register-discount selling price; discount_amount carries the deduction.
- History reports applied records only; pending and rejected records remain in the database. Approval metadata and original before/after calculation are retained.

## Still outside this implementation

Physical POS/register buttons and payment integration, promotion evaluation itself, complex tax rules, application reversals/refunds, finalization coordination with external writers and multiple standalone discounts. POS checkout must lock/coordinate open-sale edits and prevent tendering while a discount request is pending. There is no unauthenticated manager-PIN shortcut and no arbitrary sale-total mutation endpoint.

Migration: Backend/db/proposals/20260914_discount_application.sql (extends existing tables; no new tables). Requires the earlier shared catalog and register-discount migrations.
