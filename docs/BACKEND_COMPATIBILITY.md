## Latest real profile release
Real dgt/backend8182 now has user_sessions/user_login_events and runs with app.profile.enabled=true. The built real frontend is localhost5175 (CORS allowed there). Development remains5173/dgt_test8181. Profiles use existing real credentials; sessions/history start from this release. Older pending-profile-migration notes below are historical.

## Current development target
Default frontend5173 now uses dgt_test/backend8181 with copied Store1/2 data and profile/session features enabled. Real backend8182 is unchanged. `Backend/run-development.sh` is the explicit test-only startup. Prior frontend-to-real statements below are historical.

## Current status — 2026-09-11
Real dgt has the reviewed role/default-catalog migrations and six-store replacement. The current backend is healthy on 8182 and all six stores pass authenticated read checks. Frontend uses 8182. Ownership mapping is complete (two companies); prior pending migration/mapping statements below are historical. No public production deployment performed.

Current test runtime additionally requires `store_role_permissions` from `Backend/db/proposals/20260911_store_role_permissions_test.sql`. This test-only script has been applied to dgt_test, not real dgt. Do not run this JAR against real dgt until all reviewed role migrations are released.

# Real dgt backend compatibility check

**Latest status:** The new roles/permissions build requires five access tables plus stores.company_id and permissions.can_view/can_edit, applied only to dgt_test. Real dgt is compatible with the older running build, not this new JAR. No real connection switch or access migration has been performed. Earlier successful schema/startup checks below refer to the prior build.

Read-only comparison performed after the Store Account Overview migration. Compared all 77 generated Java table definitions (the names/types used by SchemaVerifier) with real public-schema metadata, plus target catalog nullability/defaults.

## Result: current backend cannot yet start against real dgt

| Field | Backend target | Real dgt | Effect |
|---|---|---|---|
| store_sub_departments.source_type | varchar(20), non-null, default CUSTOM; legacy rows UNCLASSIFIED | Missing | SchemaVerifier startup failure |
| store_departments.department_id | Nullable | NOT NULL | Custom department creation cannot follow implemented rules |
| store_departments.source_type | Default CUSTOM | Default DEFAULT | Department creation defaults differ |

All other generated column names/types matched, including Store Account Overview timezone and business-hours additions. This comparison does not prove full application readiness: it does not exhaustively compare indexes, triggers, constraints, privileges, or user data, and the updated backend was not started against real dgt.

The missing department changes were deliberately excluded from the approved page-specific migration. Do not apply them implicitly or disable the global schema verifier to bypass this finding.

## Next decision

Either approve a separate department migration after data review/backup, or prepare a backend version that supports the existing department schema while keeping that module deferred. The latter maintains the agreed page-by-page database scope but requires code changes and tests before deployment.

Authentication remains a separate prerequisite: the backend requires a configured SCHEMA_ADMIN_EMAILS allowlist and a compatible active real database user. Real login readiness has not been verified by this schema check. Production company/store permissions remain unfinished.

Frontend/src/lib/backend.ts still targets localhost:8181, the dgt_test preview. No connection was switched, no real schema/data was changed, and no production deployment was performed during this check.

## Real backend startup/login check

- Attempted isolated startup on localhost:8182 against real dgt at port 5432; UI remained on dgt_test.
- Database rejected authentication for user dgt using both the previously supplied password and existing Backend/.env password. No passwords/hashes were printed or changed.
- Verified dgt-postgres publishes port 5432. Startup did not complete; health/store API verification could not run.
- Read-only user inspection found zero rows in real users. No application login exists yet, and SCHEMA_ADMIN_EMAILS was deliberately left empty.
- Next: obtain the working database password or explicit approval for a coordinated password reset; then retry startup. Separately approve creation/configuration of the first real application administrator before authenticated API verification.
- Real schema/data changes: none. No application connection switch or deployment. Failed check processes exited.

## Real dgt test account and database connection repair

User approved password reset and labeled test data creation. Database structure was not changed in this task.

- Backup: Backend/backups/dgt_before_real_testing_20260911.dump (full pg_dump completed; no restore rehearsal).
- PostgreSQL role dgt: password reset to the user-approved value. Backend/.env DB_PASSWORD updated; SCHEMA_ADMIN_EMAILS set to admin@dgt.test. Password values are deliberately omitted here.
- stores: inserted DGT-1016, reference DGT-TEST-ONLY, name DGT Testing Store (TEST ONLY), sample legal/tax/license values, America/New_York timezone.
- store_contact_info: inserted one row linked to DGT-1016 with sample address, reserved fictional phone 202-555-0100, store-test@example.com.
- users: inserted admin@dgt.test linked to DGT-1016, employee reference TEST-ADMIN, ACTIVE, MFA false, generated BCrypt password. No permission/role rows were added; administrative access uses the current explicit backend allowlist, which permits all modules/stores, not company-scoped authorization.
- store_business_hours: inserted four DGT-1016 rows: Monday 09:00–17:00; Tuesday 22:00–06:00 next day; Saturday OPEN_24_HOURS; Sunday CLOSED. Other days unassigned.
- Real backend started on localhost:8182. Verified HTTP 200 for health, authenticated store listing and DGT-1016 settings; contact/hours values checked. Startup password blocker resolved.
- Existing store records unchanged; no UI connection switch. Frontend still uses dgt_test on port 8181.
- Test login supplied in a restricted local file /private/tmp/dgt-real-test-login.txt, not in tracked documentation.
- Remaining: approve UI connection switch, browser review, production authentication/company/store permissions, and eventual cleanup of clearly labeled real-database testing records.


### 2026-09-11 billing release
Real dgt now includes `20260911_store_billing.sql` and Basic/Modern/Advanced reference prices. Real backend8182 runs with `app.profile.enabled=true` and `app.billing.enabled=true`. Real UI5175 uses `/private/tmp/dgt-real-billing-ui`; development5173 remains on dgt_test. Billing schema details and verification are in CHANGE_LOG.md. No payment provider is enabled.


### Add-on real release — 2026-09-11
Real dgt includes 20260911_billing_addons.sql. Backend8182 uses tested add-on billing code; real UI5175 snapshot is /private/tmp/dgt-real-addons-ui. Profile and billing flags remain enabled. Add-on feature implementation and payment collection remain pending.


### Employees real release
Real dgt includes 20260911_employee_details.sql. Backend8182 enables app.workweek.enabled alongside profile and billing. Real UI5175 snapshot: /private/tmp/dgt-real-employees-ui. Employee tables initially empty; test samples not copied. Deposit instructions remain is_test=true. See CHANGE_LOG.md for schema details and pending items.

- Real dgt includes 20260911_employee_optional_login.sql; employee-access backend enabled, UI5175 snapshot now /private/tmp/dgt-real-employee-access-ui.

### Workweek workforce real release — 2026-09-11
Real dgt now includes `20260911_workforce.sql` (schedule metadata, leave store/submitter fields and workforce request/availability/leave-shift tables). Real backend8182 enables workforce and explicitly disables shift changes; UI5175 serves `/private/tmp/dgt-real-workforce-ui` targeting8182. Backup and exact schema details are in CHANGE_LOG.md. Authenticated read, cross-company denial and paused coverage/swap checks passed. Development5173/8181 remains isolated to dgt_test.
