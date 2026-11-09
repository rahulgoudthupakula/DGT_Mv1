# Rebate program and item connection

Implemented for the test environment on September 14, 2026. Production unchanged.

Price Book → Rebate Management retains Programs, Rebate Items, Claims & Payments and Rebate Reports. Programs and Rebate Items are connected. Claims/Payments and Reports are disabled pending their implementation. Sample earnings, claims, documents and browser-storage data are not used by the connected pages.

## Storage

- rebate_programs: store, vendor/provider, program name, dates, status and structured rule settings. Settings preserve qualification, measurement, reward, tiers, claim frequency, deadline and payment method for later calculations.
- rebate_program_items: store-specific product/program relationship, optional date overrides, rebate terms and active status.
- access_audit_events: program/item changes and deactivation events.

Migration: Backend/db/proposals/20260914_rebate_programs.sql. Two new tables; existing vendor/product/store tables are reused with foreign keys. No rebate earnings, claims or payment ledger is created in this step.

## Connected behavior

Admin/manager Price Book permission is required. All requests are store-scoped. Programs can be created, saved as drafts, edited, copied into a new form and deactivated. Updates require the record version and reject stale edits. Editing links also changes the parent version to protect specific-product selections from being overwritten by an older form.

Vendor/distributor providers use real vendor IDs. Manufacturer/Other providers use a saved provider name and specific/classification eligibility; they cannot claim All Products from Provider without a vendor relationship. Departments/sub-departments are store-scoped. Brand options include only brands assigned to this store's products. Specific Products is an actual product checklist, not an editable count.

Broad provider/department/sub-department/brand scopes resolve current matching active products in Program Details. Rebate Items lists explicit links and item-specific terms. Specific-product selections create links automatically. Inactive links act as exclusions for broad scopes. Item identity uses product IDs, not barcode uniqueness. Duplicate links are rejected; edit/reactivate the existing link instead.

Blank item dates inherit program dates. Explicit dates must remain within program dates. Program date narrowing requires resolving conflicting explicit item dates first. Program/item deactivation preserves records. No cross-store synchronization is enabled.

Rebate terms and rules are definitions only. The page does not yet calculate earned rebates, qualification, claim submission, payment receipt or document upload. Unknown earnings display Not calculated/— instead of sample figures.

## API

Base: /api/v1/access/stores/{store}/rebates

- GET /: programs, explicit item links and real selection lists.
- POST /programs; PUT /programs/{id} with If-Match: create/update definitions.
- POST /items; PUT /items/{id} with If-Match: create/update/deactivate links.
- GET /programs/{id}/eligible: resolved eligible products.

Validation covers allowed rule categories, dates, numeric bounds, rebate percentage bounds, tier range ordering, store-owned IDs, duplicate links and version conflicts. Active numeric programs require their target/reward fields. Free-text tier rewards and item terms are saved for later business-rule interpretation; no earnings engine consumes them yet.

## Verification

61 integration tests passed, including program/item persistence, optimistic concurrency, store access, provider/sub-department scope resolution, manufacturer configuration and deactivation. Frontend build, TypeScript and backend package passed. Browser check confirmed the test-site form, real vendor/product choices and item-linking page. Test backend: /private/tmp/dgt-rebate-test/backend.jar on 8181; frontend on 5173. No production changes or sample rebate records inserted.
