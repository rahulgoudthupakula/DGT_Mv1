# Record retention deployment review — 2026-09-15

Status: applied to local test only; backend tests pass with restricted runtime permissions. V2 is packaged for production deployment. AWS dgt_app has CONNECT and schema USAGE only; table permissions remain ungranted.

The user requires protection against deleting tables, columns and records. RDS deletion protection alone does not enforce SQL permissions. Runtime must be a non-owner without owner-role membership, DDL, DELETE or TRUNCATE privileges. Migrations use separate credentials and must be reviewed; owners can bypass runtime restrictions. UPDATE still changes values, so retaining rows does not provide immutable revision history or prevent overwriting data. Backups and audit records serve that separate purpose.

## Existing physical deletes found

| Table | Current trigger for deletion | Intended behavior |
|---|---|---|
| product_barcodes | Clearing an item barcode | Archive removed barcode; filter archived entries from lookup |
| promotion_products | Editing a promotion or bulk item links | Archive removed links; update/reactivate retained links |
| product_price_groups | Editing group membership | Archive removed memberships while preserving group display and active-group uniqueness |
| product_vendors | Unlinking vendor/item or bulk editing | Archive link; update/reactivate on relinking |
| grocery_invoice_items | Editing an unapproved invoice | Archive superseded invoice lines and insert current lines |
| fuel_delivery_lines | Saving edited fuel delivery | Update retained lines and archive removed lines |
| fuel_adjustment_lines | Saving edited fuel adjustment | Update retained lines and archive removed lines |
| daily_expenses | Saving closing payouts and reconciliation | Archive prior entries and insert current entries |
| daily_closing_tenders | Saving closing tender snapshot | Archive prior snapshots and insert current tenders |
| daily_closing_deposits | Saving closing deposits | Archive prior closing entries and insert current deposits |
| employee_compensation | Editing same-day compensation | Preserve record; reconcile current/effective records without physical deletion |

## Concrete test schema proposal

Backend/db/proposals/20260915_record_retention.sql adds one nullable archived_at timestamp to each of the 11 existing tables. It creates no new tables and deletes no data. Existing records remain current because their timestamp is NULL. No DEFAULT or data rewrite is requested. Lock timeout limits waiting on active operations. Proposal is deliberately outside Flyway's runtime directory until approved and tested; V1 must remain unchanged.

After test approval, adapt writes and all reads/calculations/joins, including invoice posting, inventory movements, reports, pricing selection, duplicate checks and optimistic concurrency. Archived lines must never affect stock, totals, eligibility or report counts. Existing unique keys may require reusing/reactivating existing link identities; review line-number/tank uniqueness before any additional constraint change. UI layout stays the same.

Validate remove/save/re-add, repeated saves, rollback, concurrent edits, and store isolation. Run restricted-role integration tests to prove allowed workflows work without DELETE/TRUNCATE and that runtime cannot alter/drop tables/columns or modify Flyway history. Review function execution and PUBLIC/inherited permissions rather than assuming absence of explicit grants is sufficient.

Only then package the reviewed incremental Flyway migration, deploy with migration credentials, grant minimum application permissions and configure EC2 to use dgt_app. No production SQL should be copied from the proposal before that validation.

## Validation completed

76 integration tests passed (66 scoped tests under the non-owner `dgt_retention_test` role, plus 10 workforce tests). Includes failed DELETE/TRUNCATE/DDL probes rolled back in transactions, barcode removal/reactivation, retained invoice history, current-only inventory posting and closing totals. Frontend production build passed. V1 and V2 migrated successfully on an empty isolated database. AWS migration and activation require the passwords to be entered directly in the EC2 terminal; no passwords are committed.
