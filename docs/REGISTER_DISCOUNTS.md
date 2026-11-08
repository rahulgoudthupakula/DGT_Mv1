# Register discount settings

Implemented in the test environment on September 14, 2026. Production unchanged.

Price Book → Discounts preserves the supplied Discount Reasons / Discounts Given layout. Settings are scoped to the selected store and use the shared discount_type catalog. Admin/manager Price Book permissions apply. Add/edit, active/inactive, duplicate code validation and optimistic concurrency are connected. Deactivation retains the definition. No demo discounts or receipt history are inserted.

New tables: store_discounts and sale_discount_applications. Migration: Backend/db/proposals/20260914_register_discounts.sql. History references its sale and discount within the same store, preserving reason/cashier/approver names and recorded amounts. The page reads history from this table, but no POS writer or eligibility/approval engine is implemented yet. It must not be populated with invented history from undifferentiated sales.discount_amount totals.

Daily cap means total amount for this discount across the store business day; 0 means no cap. Combine with promotions defaults off. These settings are saved configuration, not currently enforced against transactions. POS implementation still needs authenticated application/approval, identity eligibility where applicable, discount allocation, cap enforcement, refund handling, stacking rules and idempotent history recording. Receipt/item discounts continue to use existing sales totals.

Validation: frontend production build, TypeScript check, backend package, 59 integration tests and browser navigation/catalog-dialog check passed. Test backend on 8181 and frontend on 5173. No production release performed.

## Checkout backend update

The open-sale calculation/application API, eligibility checking, authenticated approval and pending approval UI are now implemented on test. See CHECKOUT_DISCOUNT_API.md for supported rules and limits; that document supersedes the earlier POS-backend status above. Final validation: 60 integration tests, backend/frontend builds and TypeScript passed.

## Production release

Discount settings and checkout backend released September 14, 2026. Both register-discount migrations applied, adding two tables to production (110 → 112). Health, settings, checkout options, empty approval queue and frontend release verified. No sample sales or discounts seeded. See CHECKOUT_DISCOUNT_API.md for release details and supported boundaries.
