# Project change log

This document records what changed, where it changed, and which database received it. Update it after each completed task and every real database change. Deferred work is tracked separately in PAGE_PROGRESS_TRACKER.md.

## Store Account Overview

### Frontend changes

File: Frontend/src/components/profile/StoreAccountOverview.tsx

- Restored the original Store Identity, Store Information, Timezone & Business Hours, and Connected Devices cards and edit dialog after an initial layout replacement.
- Connected store details to the Spring Boot settings API.
- Store Name and DBA Name both use stores.store_name.
- Store ID uses stores.store_id (franchise/reference ID).
- Renamed Account Number to DGT Account Number, using stores.dgt_id.
- Connected legal business name, tax ID, license number, and created date.
- Connected Address, Phone, and Store Email ID to the selected store's contact record. Renamed the email label to Store Email ID.
- Set Support Contact Email to support@dgtinnovations.com for every store. This is a frontend constant, not a new database field.
- Added a searchable worldwide timezone selector; stored values remain IANA timezone names.
- Added weekday controls inside the existing dialog for scheduled, overnight, closed, open-24-hours, and blank/unassigned days.
- Added loading/error handling and stale-edit recovery. Unimplemented fields remain visible and blank.

File: Frontend/src/lib/timezones.json

- Added a worldwide timezone fallback list for browsers without Intl.supportedValuesOf.

### Supporting frontend changes

| File | Change |
|---|---|
| Frontend/src/lib/backend.ts | Added the preview API client, in-memory Basic authentication, store/contact/hours types, store listing, settings loading/saving, and API error handling. |
| Frontend/src/pages/LoginPage.tsx | Replaced acceptance of arbitrary nonempty credentials with backend authentication/access verification. |
| Frontend/src/App.tsx | Removed localStorage boolean authentication; logout clears credentials and query cache. Refresh requires signing in again. |
| Frontend/src/pages/Index.tsx | Loads actual stores, uses dgt_id for selection, passes the selected store to the overview, and removes assumed mock parent-store identity. |
| Frontend/src/components/DashboardHeader.tsx | Replaced placeholder stores with API results. |

### Backend changes

| File or area | Change |
|---|---|
| stores/controller/StoreSettingsController.java | Added GET/PATCH /api/v1/stores/{dgtId}/settings. Loads store/contact/hours; rejects duplicate contacts; saves the combined settings transactionally with version checks. |
| stores/service/StoreHoursService.java | Added weekday/status/time validation, hours version checks, and persistence of recurring local business hours. |
| stores/service/StoreTimeService.java | Added timezone-aware business-day boundaries, including daylight-saving transitions. |
| stores/controller/StoreTimeController.java | Added GET /api/v1/stores/{id}/business-day?date=YYYY-MM-DD. |
| common/service/WriteValidator.java | Added IANA timezone validation (also contains separate department validation work). |
| stores/entity and stores/database | Updated generated Store and StoreBusinessHour mappings for timezone, hours status, and nullable times. |
| Backend/docs/schema/catalog.json | Updated the target schema metadata used by generation. This target includes additional test-only department work; it is not an exact snapshot of real dgt. |
| Backend/scripts/generate_schema_layers.py and generated documentation | Generated schema-aligned layers; custom settings/hours implementations are separate files. |

Java paths above are relative to Backend/src/main/java/com/dgt/backend unless shown otherwise.

### REAL DATABASE: applied changes

**Database:** dgt, container dgt-postgres.
**Authorization:** User explicitly approved applying the page-specific migration.
**Migration:** Backend/db/releases/20260910_store_account_overview.sql.
**Backup:** Backend/backups/dgt_before_store_account_20260910.dump. Full custom-format dump; archive listing checked. Restore rehearsal was not performed.
**Execution time:** This session, after backup. The backup archive reports 2026-09-11 03:39:39 UTC. The migration filename uses the earlier planning date 20260910; that filename is not an execution timestamp.

| Table | Column/object | Exact change |
|---|---|---|
| public.stores | timezone | Added varchar(80), nullable, no default. Existing stores remain NULL until configured. |
| public.stores | validate_store_timezone trigger | Added BEFORE INSERT OR UPDATE OF timezone trigger invoking public.validate_store_timezone(). |
| public schema | validate_store_timezone() function | Added PL/pgSQL trigger function validating non-null timezone names against pg_timezone_names. Allows UTC or slash-containing names; excludes posix/ and right/ variants. Invalid names raise SQLSTATE 23514. |
| public.store_business_hours | status | Added varchar(20) NOT NULL DEFAULT 'SCHEDULED'. |
| public.store_business_hours | open_time | Removed NOT NULL; retained time without time zone type. |
| public.store_business_hours | close_time | Removed NOT NULL; retained time without time zone type. |
| public.store_business_hours | chk_business_hours_status | Added and validated CHECK: SCHEDULED requires two non-null, different times; CLOSED, OPEN_24_HOURS, and UNSET require both times NULL. Other statuses are rejected. |

**No new tables were added for this page.**

Existing columns reused without schema changes:

- stores: dgt_id, store_id, store_name, legal_business_name, tax_id, license_number, created_at, updated_at.
- store_contact_info: contact_info_id, dgt_id, address, phone_number, email, created_at, updated_at. The UI uses stores.store_name rather than the contact table's duplicate name field.
- store_business_hours: business_hours_id, dgt_id, day_of_week, created_at, updated_at. Existing unique (dgt_id, day_of_week) and store foreign key remain.

Verification after real migration:

- Transaction committed successfully.
- Timezone trigger enabled; hours CHECK validated.
- Row counts unchanged: stores 9; store_contact_info 0; store_business_hours 0.
- All nine stores have NULL timezone. No store timezone was guessed.
- No test data was copied to real dgt.
- No department changes were applied to real dgt.
- Do not rerun the applied release migration or the original combined proposals unchanged; they would repeat column additions.

### TEST DATABASE: applied changes

Database: dgt_test, container dgt-schema-test-20260910.

- Added the same timezone column/trigger/function through Backend/db/proposals/20260910_store_timezones_departments.sql.
- Added business-hours status and nullable times through Backend/db/proposals/20260910_business_hours.sql. Its CHECK was initially added NOT VALID to preserve ambiguous legacy data; the real release migration uses a validated CHECK.
- Created temporary contact/hours fixtures for live API checks, then removed them.
- Verified contact creation/read/update, duplicate rejection, stale versions, and transaction rollback.
- Verified blank days, overnight hours, closed/24-hour days, clearing a day, persistence, and invalid equal-time rejection.

### Related department work — TEST ONLY

The original timezone proposal bundled these separate changes. They are listed here to prevent confusion with the real page-specific migration.

| Test table | Column/object | Change |
|---|---|---|
| store_departments | department_id | Removed NOT NULL. |
| store_departments | source_type | Changed default to CUSTOM. |
| store_departments | store_department_source_check | Added NOT VALID CHECK distinguishing DEFAULT linked departments from CUSTOM unlinked departments. |
| store_sub_departments | source_type | Added varchar(20) NOT NULL; existing rows assigned UNCLASSIFIED, subsequent default set to CUSTOM. |
| store_sub_departments | store_sub_department_source_check | Added CHECK allowing DEFAULT, CUSTOM, UNCLASSIFIED. |

Associated backend files: departments/repository/DepartmentRulesRepository.java, departments/service/DepartmentRules.java, common/service/WriteValidator.java, and generated department mappings. These protect default and unclassified records and support store-owned additions.

### Current release state and deferred work

- Real database schema for Store Account Overview is updated.
- Frontend remains connected to the local dgt_test preview on backend port 8181. Application deployment/switch to real dgt has not occurred.
- Current backend has additional department schema expectations; resolve deployment compatibility before switching it to real dgt.
- Subscription Status, Last Login, Account Status (version 2), and Connected Devices remain deferred.
- Production authentication, company/store permissions, approvals, legacy CRUD coordination, and browser review remain pending.
- Builds/TypeScript and API checks passed; no claim of completed interactive browser testing.

## Earlier backend foundation work

Before this page, the backend was generated/aligned to the inspected 77-table schema, with entities, repositories, services, controllers, metadata, validation, and administrative preview access. This is background code work, not evidence of 77 tables being created in real dgt. The detailed page-specific real database changes are enumerated above.

## Entry template for future changes

- Page/feature:
- Date/time:
- User-approved scope:
- Frontend files and behavior:
- Backend files and API changes:
- Test database changes (table, column, type, nullability, default, constraints, indexes, functions/triggers):
- Real database changes (same details, or explicitly none):
- Migration and backup locations:
- Data changes/backfills and before/after counts:
- Verification performed and limitations:
- Deployment status:
- Deferred items / tracker reference:

## Backend compatibility review after Store Account Overview

- Read-only comparison of real dgt against all 77 generated table definitions and target catalog nullability/defaults.
- Found startup blocker: missing store_sub_departments.source_type.
- Also found department_id nullability and source_type default differences in store_departments.
- Store Account Overview column names/types match the backend target.
- Added docs/BACKEND_COMPATIBILITY.md with findings and next options.
- Real database changes: none. Application connection/deployment changes: none.

## Departments — real dgt source classification migration

Applied with explicit user approval after the compatibility review. This entry supersedes earlier statements that department changes exist only in testing.

- Migration: Backend/db/releases/20260911_department_sources.sql.
- Fresh full backup: Backend/backups/dgt_before_department_sources_20260911.dump; archive listing verified readable (no restore rehearsal).
- public.store_departments.department_id: removed NOT NULL; type remains bigint.
- public.store_departments.source_type: changed default from DEFAULT to CUSTOM; existing values are not rewritten.
- public.store_departments.store_department_source_check: added validated CHECK requiring DEFAULT with a non-null department_id or CUSTOM with a null department_id.
- public.store_sub_departments.source_type: added varchar(20) NOT NULL with initial UNCLASSIFIED default for existing rows; then changed default to CUSTOM for future rows.
- public.store_sub_departments.store_sub_department_source_check: added validated CHECK allowing DEFAULT, CUSTOM, UNCLASSIFIED.
- Before/after counts: 0 store departments, 0 store subdepartments. No existing records required classification or deletion.
- No new tables, frontend changes, backend code changes, or application connection switch.
- Verification: all 77 generated table definitions now match real dgt column names/types; department defaults/nullability verified; both new CHECK constraints validated.
- Remaining: real-user authentication/access configuration, application startup/deployment verification, and browser review. UI still uses dgt_test.

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

## Department Access — Add Department

- Frontend/src/components/profile/StoreManagementPage.tsx: added Add Department dialog; replaced mock department list with store-specific API data and shared database defaults. Refreshes after creation; handles loading/errors and disables previously unsaved status switches.
- Frontend/src/pages/Index.tsx: passes selected dgt_id; remounts the page on store switch to clear old drafts.
- Backend/src/main/java/com/dgt/backend/departments/controller/StoreDepartmentAccessController.java: added GET/POST /api/v1/stores/{dgtId}/department-access. Queries selected store only plus shared defaults; creates CUSTOM records; validates names and checks duplicates under a store-row lock.
- Database schema changes: none, real or test. No real data changes. Uses existing store_departments columns dgt_id, store_department_name, source_type, is_active and generated ID/timestamps.
- dgt_test temporary rows 3 and 4 were created for verification and removed. Verified persistence, no appearance in another store, same-store case-insensitive duplicate rejection, and same name permitted in another store.
- Backend package, frontend TypeScript/build passed. Updated test backend restarted on 8181. Real backend/UI connection unchanged.
- Scope limitation: store-specific display is implemented; authorization remains the existing administrator allowlist, not completed company/store permission enforcement. Generic CRUD remains available to preview administrators.
- Pending: browser review, persisted status editing, subdepartment UI, roles/approvals, and integration tab wiring. Other tabs retain their prior behavior; no production release for this change.

## Restore original default department catalog (test only)

- Source: Frontend/src/data/departments.ts, 32 departments and 453 parent-specific subdepartment entries. All 441 pasted entries match; retained the original Services department with 12 entries.
- Added Backend/src/main/resources/catalog/default-departments.json and DefaultDepartmentCatalog.java. Shared subdepartment definitions are served from this catalog, not inserted into store-owned subdepartment rows; no tax or operational rules inferred from names.
- Applied Backend/db/proposals/20260911_default_catalog_test.sql only to dgt_test: inserted 32 missing departments rows (department_name, is_default=true). Existing rows were preserved. No schema changes.
- Department Access endpoint returns approved original defaults with their subdepartment names plus the selected store's custom rows. Non-catalog default test fixtures remain in the database but are omitted from this display.
- StoreManagementPage displays expandable default departments with subdepartment counts/lists. Existing Add Department remains store-specific.
- Backend/frontend builds and TypeScript passed. Live API checked exact catalog equality (32/453) for both test stores.
- Real dgt schema/data and real backend unchanged. Pending: browser review, production catalog release, future shared subdepartment persistence design, custom subdepartment UI and status editing.

## Department Access — activate/deactivate without deletion

- User approved activation/deactivation for the selected store, not deletion.
- StoreDepartmentAccessController: listing now reads store-specific default assignments and returns a version. PATCH /api/v1/stores/{dgtId}/department-access/{id} accepts only active and requires If-Match; locks the parent store, rejects stale/cross-store targets, creates a DEFAULT assignment on first toggle, or updates is_active/updated_at. Shared names/hierarchy unchanged. Duplicate default assignments return an issue.
- Custom toggles use existing validated service updates. No DELETE endpoint added; DELETE checked and rejected with 405.
- StoreManagementPage: enabled switches with saving state, API persistence, list refresh and error display. Inactive rows stay visible.
- Schema changes: none. Real dgt data/code deployment unchanged. Test backend restarted on 8181.
- dgt_test verification: default/custom deactivation, default reactivation, persisted reads, other-store isolation, stale-version 409, cross-store 404 and DELETE 405 passed. Temporary custom row 7 removed; a default Arts, Crafts & Sewing assignment remains active after restoration.
- Backend package, TypeScript and frontend build passed; interactive browser review remains pending.
- Status currently controls Department Access state only. Applying inactive filtering to other item/report screens is separate work; production authorization and legacy CRUD coordination remain pending.

## Roles & Permissions proposal prepared

- Added docs/ROLES_PERMISSIONS_PLAN.md and Backend/db/proposals/20260911_roles_permissions_test.sql.
- Proposed companies, company_admins, module_approval_policies, approval_requests and access_audit_events tables; stores.company_id; permissions.can_view/can_edit; constraints, indexes and conservative existing-permission backfill.
- Includes phased UI/API enforcement and approval handling, bootstrap/release prerequisites, and validation cases.
- No SQL applied; no real/test schema or data changes, UI changes, authentication changes, or deployment in this task.

## Roles & Permissions — implemented in dgt_test (2026-09-11)

### Applied test database changes

Backup: Backend/backups/dgt_test_before_roles_20260911.dump (full dump completed; no restore rehearsal).
Migration applied: Backend/db/proposals/20260911_roles_permissions_test.sql. This supersedes its earlier proposal-only status. Guard prevents execution against real dgt.

| Table | Columns added / table created |
|---|---|
| stores | company_id bigint NULL, FK to companies; stores_company_idx |
| permissions | can_view boolean NOT NULL DEFAULT false; can_edit boolean NOT NULL DEFAULT false; permissions_edit_requires_view CHECK |
| companies (new) | company_id identity PK, company_name varchar(200), is_active, created_at, updated_at |
| company_admins (new) | company_id/user_id composite PK and FKs, is_active, created_at, updated_at |
| module_approval_policies (new) | company_id/module_id composite PK and FKs, manager_requires_admin boolean default false, updated_by user FK, created_at, updated_at |
| approval_requests (new) | request_id identity PK, company_id, dgt_id, module_id, requested_by, requester_role_id, required_approver, operation_code, target_id, expected_versions JSONB, proposed_values JSONB, status, reviewed_by, review_note, idempotency_key UUID, created_at, reviewed_at |
| access_audit_events (new) | event_id identity PK, company_id, dgt_id, actor_user_id, event_type, target_type, target_id, changes JSONB, created_at |

Full types/defaults/nullability, indexes and FK/CHECK/unique definitions are in the applied SQL and Backend/docs/schema/access-catalog.json. Approval checks restrict reviewer classes/statuses, JSON objects and self-review; requester/idempotency key is unique; queue index covers company/store/status/time. No generic CRUD exposure for new access tables. Existing permission backfill updated zero rows because test permissions were empty.

Test bootstrap applied: Backend/db/proposals/20260911_roles_test_accounts.sql.

- Created two labeled companies. Explicitly linked existing DGT-1001 to Company A and DGT-1002 to Company B through stores.company_id; no inferred real ownership.
- Added company admin memberships for admin@dgt.test (A) and existing reader@dgt.test (B).
- Added ADMIN, MANAGER, CASHIER, ACCOUNTANT role definitions and STORE_SETTINGS/DEPARTMENTS modules.
- Created manager@dgt.test, cashier@dgt.test, accountant@dgt.test users with existing local test-password hash; created three role assignments for DGT-1001 and six module permissions. Accountants have view only; managers/cashiers have view/edit. Test credentials are documented in ROLES_PERMISSIONS_TESTING.md.
- No policy enabled by default. Test-suite fixtures are isolated and cleaned up; seed preview records remain for user review.

### Backend changes

New access package: ScopedAccess.java, AccessController.java, ApprovalService.java, ApprovalController.java, AccessSchemaVerifier.java.

- Replaced global email allowlist authorization with active company membership and store-role/module grants for connected workflows.
- Added current-user, scoped-store-list/context, admin permission/role/policy management and approval queue/decision APIs.
- StoreSettingsController and StoreDepartmentAccessController now submit through the approval service. Admin/eligible manager writes apply immediately; cashier/edit-enabled accountant and configured manager writes queue instead.
- Approval validation uses savepoint rollback; reviewer approval rechecks current requester rights, company/store identity, required role and row versions. Decision/apply/audit share a transaction; company/request locking prevents duplicate application.
- Generic controllers and unfinished special routes are denied via SecurityConfig and AccessPolicy. Scoped business-day endpoint retained through StoreTimeController.
- Added PUT and Idempotency-Key CORS support. Error dispatches preserve HTTP error status. Existing Basic authentication remains local-preview only.
- Updated original schema catalog and generated Store/Permission mappings for company/view/edit fields; company_id is read-only to generic validation. Generator updated accordingly. New access table metadata is separate from the 77-table generic generator.

### Frontend changes

- RolePermissionsPanel.tsx: real per-user/store assignments, view/edit controls, company-wide manager approval switches, and request review/approve/reject/cancel panel.
- store-access.ts: loads current store's rights; backend.ts: uses /access/me and /access/stores, sends idempotency headers, recognizes pending results.
- StoreAccountOverview and StoreManagementPage: gate reads/edits by rights, show pending submission instead of successful application, preserve connected layouts.
- Grocery/lottery permission placeholders and integration actions remain disabled with unimplemented values blank. Removed Viewer label in favor of Cashier without converting existing users.
- Index: only mounts the two connected profile pages in this scoped preview. Other page layouts remain in source but show an unavailable message, avoiding legacy Supabase/mock flows that do not enforce these permissions. Default landing is Store Account Overview.

### Validation, deployment and remaining scope

- mvn verify passed: 11 scoped integration tests, zero failures/errors/skips. Tests cover cross-company/store denial, legacy bypass denial, accountant defaults/revocation, manager policy, no self-approval, repeated/parallel decisions, pending persistence, stale rollback, ownership protection, role assignment/deactivation, approved contact/settings saves, audit presence and DST boundary.
- Archived the obsolete truncate-all/email-allowlist test suite; replaced it with isolated fixtures in ScopedAccessIntegrationTest.java. Did not claim the old suite passes under the new contract.
- Frontend TypeScript and production build passed. Test preview restarted on 8181; verified all five test logins, expected company-scoped stores, module flags and full 32-default-department catalog.
- Interactive browser review still pending. Remaining modules, company-admin management UI/API, audit-review UI, production session design, real company mapping and release approval remain pending.
- REAL DATABASE CHANGES: NONE in this task. Real backend on 8182 and real login records were not changed. Current new JAR requires this new migration; do not restart it against real dgt until separately approved and bootstrapped.
- Documentation: ROLES_PERMISSIONS_TESTING.md contains current contract/accounts/steps; README and TEST_PREVIEW updated; older instructions retained in archive.

## 2026-09-11 — Roles & Permissions: Add User (test preview)

- Page: Store Management / Access & Integrations / Roles & Permissions. Added an Add User dialog while retaining existing assignment and permission controls.
- Frontend: `Frontend/src/components/profile/AddUserDialog.tsx` (new), `RolePermissionsPanel.tsx` (button integration). Fields: first/last name, employee ID, email, password, role, stores, module view/edit choices. Manager can select additional company stores; cashier/accountant use current store. Accountant edit is off initially; admin can enable it.
- Backend: `Backend/src/main/java/com/dgt/backend/access/AccessController.java`: new admin-only `POST /api/v1/access/stores/{store}/users`. Validates company ownership, supported roles/modules, duplicate email/employee IDs, view/edit consistency, password length. Atomic creation; BCrypt password hashing; response and audit omit credentials. Company-admin membership cannot be granted through this endpoint.
- Existing DB columns written when an admin creates an account: `users` (`dgt_id`, `employee_id`, `first_name`, `last_name`, `email`, `password_hash`; identity/status/MFA/timestamps use existing defaults), `user_roles` (`user_id`, `role_type_id`, `dgt_id`, `is_active`), `permissions` (`user_role_id`, `module_id`, `is_active`, `can_view`, `can_edit`), `access_audit_events` (`company_id`, `dgt_id`, `actor_user_id`, `event_type`, `target_type`, `target_id`, `changes`; identity/time defaults).
- Schema changes: none. Real `dgt`: no tables, columns, records, or passwords changed. Test fixtures created by automated tests were cleaned up.
- Validation: Maven verify passed (13 integration tests); TypeScript check and Vite production build passed. New tests cover account login, selected module/store isolation, admin-only creation, cross-company denial, duplicate rejection, password hashing, invalid inputs, forbidden admin role, credential-free audit, and atomic validation failure.
- Preview backend restarted on 8181 using `dgt_test`. Manual browser review remains pending. Existing bundle size warning remains.
- Deferred: invitations, email delivery, password reset/change flow, company-admin management, remaining modules, real DB release. New users receive a password entered by admin; no invitation is sent.

## 2026-09-11 — Store user list and Edit Access
- Page: Roles & Permissions. Replaced user/role dropdown and existing-user assignment controls with a table of the selected store's user-role assignments (email, role, active/inactive status, Edit Access).
- File: `Frontend/src/components/profile/RolePermissionsPanel.tsx`. Edit Access opens a dialog for that assignment's module View/Edit permissions and active status; changes save immediately using existing version-checked APIs. New users appear through the existing Add User query refresh.
- Company-wide manager approval settings remain on the main card, outside individual user editing. Existing approval queue preserved.
- Backend/API/schema: unchanged. No real or test database records changed by this task. User edits in the preview continue using existing permissions/user_roles/audit tables in dgt_test.
- Validation: TypeScript check and Vite build passed; existing bundle-size warning remains. Browser interaction review pending.

## 2026-09-11 — Store-specific role permission matrices (supersedes individual Edit Access)

- User-approved scope: test UI/backend/database. Permissions now belong to each store + role, not individual users. Existing/new assignments inherit that store's settings; manager assignments to multiple stores use each store's own permissions. Admin remains company-scoped and has full access.
- UI: `StoreRoleMatrix.tsx` added to StoreManagementPage. Store/Grocery/Lottery permission tables now have editable Manager/Cashier/Accountant columns; Admin checked and locked. Each checkbox saves immediately. `RolePermissionsPanel.tsx` retains user/role/status list and company-wide approval policies, removes individual Edit Access. `AddUserDialog.tsx` now selects role/store(s), with no individual module choices.
- Backend: new `RoleAccessController.java`, GET/PUT `/api/v1/access/stores/{store}/role-permissions`, admin-only, allowlisted action/role codes, optimistic versions, store/company isolation, audit. Edit requires view; removing view revokes edit. `ScopedAccess.java` now enforces store-role grants for Store Account Overview and Department Access, including approval-time rechecks. `AccessController.java` individual permission PUT now returns 410; account creation rejects individual module overrides and inherits role access. `AccessSchemaVerifier.java` requires the new table.
- Applied only to `dgt_test`: `Backend/db/proposals/20260911_store_role_permissions_test.sql`. Backup: `Backend/backups/dgt_test_before_store_roles_20260911.dump`.
- New table `store_role_permissions`: `dgt_id varchar(50)` FK stores, `role_type_id bigint` FK role_types, `permission_code varchar(80)` constrained to 20 supported setting codes, `allowed boolean NOT NULL DEFAULT false`, `updated_by bigint` nullable FK users, `updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP`. Composite PK (`dgt_id`,`role_type_id`,`permission_code`). No other columns or tables altered.
- Migration inserted 12 role-setting rows from existing active assignments. Only access common to every active assignment of that store/role was retained; missing/conflicting individual grants resolve to denied. Old `permissions` rows retained for history but ignored for authorization; no individual override path remains.
- Real `dgt`: no schema/data/password changes. New runtime needs this migration in addition to prior RBAC migrations before any real release.
- Validation: Maven verify passed all 14 integration tests, including role inheritance for new/existing managers, store isolation, permission revocation, stale matrix writes, unauthorized matrix changes, blocked legacy individual writes, and continued denial of unfinished grocery endpoints. TypeScript and Vite build passed; existing bundle warning remains. Test backend restarted at 8181. Browser review pending.
- Deferred explicitly: Grocery/Lottery action settings now persist, but those business endpoints/screens are not implemented in this preview and remain blocked. UI explains this; saved settings do not imply completed operations. Existing approval rules continue for implemented edits. No email/invitation/reset workflow or production release added.

## 2026-09-11 — Permission table Edit / Save Preferences / Cancel
- Page: Roles & Permissions, Store/Grocery/Lottery role tables. Checkboxes are read-only until Edit is clicked. Save Preferences submits that table's draft together; Cancel discards local changes without writing. Admin column stays locked. One table can be edited at a time.
- Frontend: `StoreRoleMatrix.tsx`; retains original versions during editing, automatically pairs View/Edit, preserves draft on save failure.
- Backend: `RoleAccessController.java`, new transactional PUT `/api/v1/access/stores/{store}/role-permissions/batch`. Validates original versions before any writes, applies dependent View/Edit changes in order, and rolls back all changes on error. Existing authorization/audit rules retained.
- DB/schema: no new tables/columns or real dgt changes. Saving in preview updates existing dgt_test `store_role_permissions.allowed`, `updated_by`, `updated_at` (inserts missing composite keys) and `access_audit_events`. Automated test fixtures cleaned up.
- Validation: 15 integration tests passed including batch rollback, successful multi-change save, stale conflict, and nonadmin denial. TypeScript/Vite passed; existing bundle warning remains. Backend restarted on 8181. Browser review pending. Company-wide manager approval policy controls retain their existing immediate-save behavior.

## 2026-09-11 — Real dgt release: schema applied, ownership mapping pending
- User explicitly approved applying completed changes to real dgt and connecting preview; Integrations/API and unfinished workflows remain deferred.
- Preflight: 10 stores, one user admin@dgt.test based at DGT-1016, no role_types/modules/departments rows and no company/access tables. Nine other stores have no supplied company/admin ownership mapping. Asked user for mapping; no ownership inferred.
- Backup: `Backend/backups/dgt_before_role_release_20260911.dump`, PostgreSQL custom format; archive listing successfully verified.
- Applied transaction: `Backend/db/releases/20260911_roles_and_default_departments.sql` (real dgt guard, lock/statement timeouts).
- Existing table fields added: `stores.company_id bigint` nullable FK companies + stores_company_idx; `permissions.can_view boolean NOT NULL DEFAULT false`, `permissions.can_edit boolean NOT NULL DEFAULT false`, edit-requires-view CHECK. Existing permission rows updated: 0.
- New `companies`: company_id identity PK, company_name, is_active, created_at, updated_at.
- New `company_admins`: company_id/user_id composite PK and FKs, is_active, created_at, updated_at.
- New `module_approval_policies`: company_id/module_id composite PK and FKs, manager_requires_admin, updated_by, created_at, updated_at.
- New `approval_requests`: request_id identity PK, company_id, dgt_id, module_id, requested_by, requester_role_id, required_approver, operation_code, target_id, expected_versions, proposed_values, status, reviewed_by, review_note, idempotency_key, created_at, reviewed_at. FKs/checks and queue/idempotency indexes as specified in release SQL.
- New `access_audit_events`: event_id identity PK, company_id, dgt_id, actor_user_id, event_type, target_type, target_id, changes, created_at.
- New `store_role_permissions`: dgt_id, role_type_id, permission_code composite PK; allowed, updated_by, updated_at; FKs/code CHECK. Backfilled role grants: 0 (no preexisting assignments).
- Reference rows inserted: role_types.role_type_name ADMIN/MANAGER/CASHIER/ACCOUNTANT (4), modules.module_name STORE_SETTINGS/DEPARTMENTS (2), departments.department_name + is_default=true (32 approved default parents). Identity/timestamp/status values use existing defaults. Default subdepartment lists remain application catalog data, not new SQL subdepartment rows.
- No users, credentials, store business fields, contacts or hours copied from dgt_test. All stores.company_id remain NULL pending explicit mapping.
- Latest backend launched against real dgt at localhost:8182. Preview switch and authenticated store access verification pending mapping. Existing test backend remains on 8181.

- Post-release read-only verification: real backend `/api/v1/health` returned UP; all six new tables exist; 32 default departments; existing 10 stores and one user preserved. Company assignments remain 0. Frontend still points to test backend 8181 until ownership is supplied.

## 2026-09-11 — Approved real dgt six-store replacement and preview cutover

- User explicitly approved deleting all ten existing stores and linked records after backup, preserving the existing admin, and creating Store 1–6 in two company groups. Generated store data is sample data.
- Backup: `Backend/backups/dgt_before_six_store_replacement_20260911.dump`; custom archive listing verified in `/private/tmp/dgt-six-store-backup-manifest.txt`.
- Release: `Backend/db/releases/20260911_six_store_replacement.sql`. Single guarded transaction, snapshot checks, locks, no TRUNCATE/CASCADE. Initial attempt hit overlapping STORE-002 and rolled back; corrected transaction stages replacement reference IDs before deleting old stores, then assigns STORE-001..006. Identity sequence gaps from the rolled-back attempt are harmless.
- Deleted real records: stores DGT-1002,1004,1005,1007,1008,1009,1012,1014,1015,1016 (10 total); the old DGT-1016 contact (1) and business hours (4). Preflight found no business transactions or other linked rows. Existing 32 departments, 4 role types, and 2 modules retained.
- Schema added in real dgt: `companies.primary_store_dgt_id varchar(50)` nullable; `stores_company_dgt_unique` UNIQUE(stores.company_id,stores.dgt_id); `companies_primary_store_fk` composite FK(companies.company_id,companies.primary_store_dgt_id) -> stores(company_id,dgt_id). This records the main store in its own company; authorization still uses company membership.
- Inserted companies: Store 1 Retail Company (main DGT-1017), Store 3 Retail Company (main DGT-1019). Fields company_name/primary_store_dgt_id; IDs/active/timestamps generated by database defaults.
- New store mapping:
  - DGT-1017 / STORE-001 / Store 1 — Store 1 Retail Company — America/New_York.
  - DGT-1018 / STORE-002 / Store 2 — Store 1 Retail Company — America/Chicago.
  - DGT-1019 / STORE-003 / Store 3 — Store 3 Retail Company — America/Los_Angeles.
  - DGT-1020 / STORE-004 / Store 4 — Store 3 Retail Company — America/Denver.
  - DGT-1021 / STORE-005 / Store 5 — Store 3 Retail Company — America/Phoenix.
  - DGT-1022 / STORE-006 / Store 6 — Store 3 Retail Company — Pacific/Honolulu.
- `stores` fields populated: dgt_id (existing generator), store_id, store_name, legal_business_name (`Sample Store N Retail LLC`), tax_id (`SAMPLE-TAX-00N`), license_number (`SAMPLE-LIC-00N`), timezone, company_id; created_at/updated_at defaults. Unique legal-business-name constraint is preserved.
- `store_contact_info`: six rows with dgt_id/store_name, clearly labeled sample addresses, +1-202-555-0101..0106, store1@example.com..store6@example.com; IDs/timestamps default. Support email remains support@dgtinnovations.com in the UI.
- `store_business_hours`: 42 rows, each store Monday–Saturday SCHEDULED 08:00–20:00 and Sunday CLOSED with NULL times; dgt_id/day_of_week/status/open_time/close_time set, identity/timestamps default.
- `users`: preserved existing user_id/email/password_hash; changed admin@dgt.test dgt_id to DGT-1017 and updated_at. No password reset or extra users. `company_admins`: two memberships give this existing admin access to both generated companies.
- `store_role_permissions`: 72 initial rows (six stores x three roles x four implemented View/Edit codes), updated_by points to preserved admin. Manager gets view/edit; Cashier/Accountant initially view-only. Other permissions remain denied until admin configures them.
- `access_audit_events`: six STORE_SETUP entries with company_id/dgt_id/actor_user_id/event_type/target_type/target_id/changes; changes describe sample setup and initial role preferences. No credentials logged.
- Frontend `src/lib/backend.ts` now connects to real backend localhost:8182/api/v1; error text updated. `src/pages/LoginPage.tsx` explicitly labels real dgt connection. Test backend 8181 remains available but is no longer the preview target.
- Validation: preserved admin authentication succeeded; all six scoped store lists/settings/contact emails/32 default departments/admin contexts/12 role settings per store verified via read-only real APIs. TypeScript and Vite build passed; existing bundle warning remains. No automated business writes performed beyond the authorized setup. Browser review remains manual.
- Integrations/API section, unfinished Grocery/Lottery workflows, invitations/password reset and other tracked deferred features remain pending. This is a local preview connected to real dgt, not a public production deployment.

## 2026-09-11 — Requested real company/store accounts
- User requested current users plus one additional admin/manager per company and one cashier per store, with credentials. Existing admin@dgt.test preserved (both companies).
- Backup: `Backend/backups/dgt_before_requested_users_20260911.dump`. Provisioned ten accounts atomically after snapshot guards. No schema changes.
- Company 1 / Store 1 Retail Company (company_id=3): admin@company1.dgt.test has company-admin membership; manager@company1.dgt.test has MANAGER assignments to DGT-1017 and DGT-1018.
- Company 2 / Store 3 Retail Company (company_id=4): admin@company2.dgt.test has company-admin membership; manager@company2.dgt.test has MANAGER assignments to DGT-1019, DGT-1020, DGT-1021, DGT-1022.
- cashier@store1.dgt.test through cashier@store6.dgt.test each has one CASHIER assignment, corresponding to DGT-1017 through DGT-1022.
- Real DB inserts: `users` 10 rows (dgt_id, employee_id, first_name, last_name, email, BCrypt password_hash; account_status ACTIVE, MFA false, identities/timestamps use defaults); `company_admins` 2 rows (company_id,user_id; active/timestamps default); `user_roles` 12 rows (user_id,role_type_id,dgt_id; active/timestamps default); `access_audit_events` 10 ACCOUNT_PROVISIONED entries (company_id,dgt_id,actor_user_id,event_type,target_type,target_id,changes with role/store list; identity/time default).
- Store-role permissions unchanged: managers currently view/edit implemented modules, cashiers view only. Accountants were not requested and none created. Company admins are represented in company_admins, not a store ADMIN role assignment.
- Passwords individually generated and BCrypt hashed. Existing admin password unchanged. Private credential list: `/private/tmp/dgt-all-user-credentials.md` (0600); no plaintext passwords added to repository docs. Provisioning SQL with hashes retained privately at `/private/tmp/dgt-provision-requested-users.sql`.
- Validation: authenticated all 11 accounts; exact assigned store lists verified, contexts confirm expected admin/view/edit rights, and foreign-store settings reads rejected for every restricted account. Read-only smoke checks, no extra business changes.

## 2026-09-11 — User-requested simple account passwords
- Changed passwords for all 11 existing real dgt accounts using the user-requested numbered pattern, in the previously supplied account-list order.
- Database fields changed: `users.password_hash` (fresh BCrypt hashes) and `users.updated_at`. Applied as one guarded transaction. No DB-role password, permissions, memberships or schema changed.
- Verified all 11 logins successfully through `/access/me`. Updated private credential list `/private/tmp/dgt-all-user-credentials.md` and private login references; no plaintext passwords recorded here.

## 2026-09-11 — User Profile Management (test only)
- Preserved the page cards; connected first/last name, email, and change-password controls to the signed-in user. Full Name is represented by explicit First Name / Last Name fields to match existing DB columns without guessing name splits. Removed sample history/session records; deferred sections show empty-state messages, MFA toggle disabled.
- Backend: new `access/ProfileController.java`, enabled only by `app.profile.enabled=true`. GET/PATCH `/api/v1/access/profile`; PUT `/api/v1/access/profile/password`. Resolves account from authenticated principal, never accepts a target user ID. Uses row locks and If-Match versions; unique-email checks; current password required for email/password changes; BCrypt hashing; confirmation/length validation. Response contains first_name,last_name,email,version only. No role/company/account-status edits exposed.
- Frontend: `UserProfileManagementPage.tsx` hooks and forms, sign-out/cache clearing after email/password change; existing name save retains session. `Index.tsx` gates page through `VITE_PROFILE_PREVIEW=true`; `backend.ts` permits environment API target; `LoginPage.tsx` identifies test preview.
- Schema changes: none. Test profile writes affect only existing `users.first_name`, `last_name`, `email`, `password_hash`, `updated_at`. No real dgt records/passwords/schema changed. No profile audit/history records are created in this iteration.
- Runtime: separate frontend localhost:5174 with VITE_API_BASE_URL=http://localhost:8181/api/v1 and VITE_PROFILE_PREVIEW=true; backend8181 uses dgt_test and profile flag enabled, CORS allows5174. Real backend8182 is untouched; existing frontend5173 still targets real dgt with profile page gated off.
- Validation: Maven verify passed16 integration tests, including own-profile isolation, attempted user_id override, stale version, duplicate email, bad current password, email-login transition, confirmation/length checks, old-password rejection, new-password login. TypeScript and profile Vite build passed (existing bundle warning). Read-only profile smoke checks for admin/manager/cashier/accountant and CORS passed. No browser automation available; manual UI review pending.
- Test sign-in: existing *@dgt.test test users with test-only-password (different from real numbered passwords). Sign in again after a profile email/password change.
- Deferred: two-factor authentication, login history, device/session management, profile audit trail, real release.

## 2026-09-11 — Admin navigation restriction corrected
- `Frontend/src/pages/Index.tsx` now uses selected-store admin context: company admins can open all existing page layouts, while connected pages retain their functioning controls and nonadmins retain prior restrictions.
- Unfinished layouts have an explicit preview banner and disabled/inert content, blocking mouse, keyboard and form actions. Existing hardcoded example content remains visibly labelled as layout examples; converting every unfinished page to empty-data states remains pending. No claim these unfinished workflows are live.
- `UserProfileManagementPage.tsx` accepts an enabled flag: real preview shows its blank disabled layout without calling the test-only profile endpoint; the separate5174 profile preview remains functional.
- `integrations/supabase/client.ts`: legacy REST/storage fetches return an unavailable response locally; realtime subscriptions are inert; session persistence/refresh disabled. Prevents unfinished layouts from reaching the old unscoped data source. Spring backend requests unaffected.
- No backend/schema/real database changes. Frontend TypeScript/build checks passed; existing bundle warning remains. Browser review and per-page removal of remaining hardcoded examples are pending.

## 2026-09-11 — Test profile sample names, real login history and device sessions
- User explicitly chose actual login tracking/revocation, not sample activity rows. MFA remains disabled/unimplemented. Real dgt and backend8182 unchanged.
- Backed up dgt_test to `Backend/backups/dgt_test_before_profile_sessions_20260911.dump`; applied `Backend/db/proposals/20260911_profile_sessions_test.sql`.
- New test table `user_sessions`: session_id UUID PK, user_id FK users, token_hash varchar64 unique (SHA-256), credential_fingerprint varchar64, ip_address varchar64, user_agent varchar512, created_at, last_active_at, expires_at, revoked_at (timestamptz); user index. Random256-bit tokens stored only as hashes. Sessions expire after8hours; last-active updates throttled to1minute. Credential fingerprint invalidates tokens after external email/password changes too.
- New test table `user_login_events`: event_id identity PK, user_id FK users, occurred_at timestamptz, ip_address varchar64, user_agent varchar512, status SUCCESS/FAILED CHECK; user/time index. Sign-in history records explicit session-login attempts for known users, not every Basic API request; unknown emails cannot be attributed to a user and are not included. Never logs passwords/tokens.
- Sample data updates: `users.first_name`, `last_name`, `updated_at` for admin@dgt.test=Avery Morgan, reader@dgt.test=Jordan Lee, manager@dgt.test=Casey Patel, cashier@dgt.test=Riley Shah, accountant@dgt.test=Taylor Reed. Emails/passwords/roles/MFA and user-created rahul@dgtstore.com untouched.
- Backend new `ProfileSessions.java`/`ProfileSessionController.java`, active only when app.profile.enabled=true. POST `/access/session` uses verified Basic credentials to create token, POST `/access/session/logout` revokes it. GET `/access/profile/history` returns newest100 own events; GET `/access/profile/sessions` returns active own sessions/current marker; POST `/access/profile/sessions/{id}/revoke` enforces ownership. `SecurityConfig.java` installs bearer validation and sign-in failure logging conditionally. `ProfileController.java` revokes all sessions on email/password change. Revocation prevents subsequent authenticated requests; it cannot undo already-completed/in-flight actions. Basic API authentication remains available for existing integration tests; browser test login switches to bearer tokens.
- Frontend `backend.ts`: test-mode login exchanges Basic for in-memory token; logout revokes token, then clears credentials. Real-mode Basic login unchanged. `UserProfileManagementPage.tsx`: actual history, actual session metadata/current marker, Refresh Activity, Revoke and Sign Out. Displays IP instead of invented location; dates use browser timezone. Session list refreshes every30seconds. No fabricated history/device records. Refreshing the page clears the in-memory token; a previous session expires or can be revoked from a later login.
- Validation: all18 integration tests passed, covering own-profile edits, credential changes, login tracking, token privacy, cross-user revoke rejection, token expiry, revoked-token rejection, logout and password-change revocation. TypeScript/profile build passed; known bundle warning remains. Live test verified Avery Morgan, actual sign-in events, current session, revoke401, logout. Verification sessions were revoked; their genuine login events remain labelled DGT profile verification.
- Runtime: test backend8181 restarted; frontend5174 uses dgt_test. No public deployment, real migrations, real password changes or MFA enablement. Remaining: manual multi-browser review, real release approval, production login rate limits/history retention policy.

## 2026-09-11 — Blank profile report and browser verification
- User reported blank profiles on both5173 and5174. Verified served environment flags:5173 targets real dgt with test profile disabled;5174 targets dgt_test with profile enabled.
- `Frontend/src/pages/Index.tsx`: User Profile Management is now a connected navigation destination independent of role. On5173, replace disabled blank form with explicit test-preview explanation/link and sign-in instructions. On5174, render live self-profile as before. No real profile deployment or DB/schema change.
- Reproduced fresh test sign-in in isolated headless Chrome: fields contain Avery/Morgan/admin@dgt.test and are enabled; actual login history/current session render. Blank state not reproduced on5174 after fresh login. Screenshot `/private/tmp/dgt-profile-working.png`. Verification session signed out. Actual browser verification event remains in test login history.
- TypeScript and Vite build passed. If the user's test tab remains blank after full reload/sign-in, investigate that browser's screenshot/error rather than assuming a server-side data issue.

## 2026-09-11 — One development URL using Store 1 and Store 2 in dgt_test
- Explicit user approval: copy Store 1/2 accounts/configuration from real dgt into test and retire the separate demo-store setup. Real source was read only; no real records/schema/passwords changed.
- Backup: `Backend/backups/dgt_test_before_store1_store2_copy_20260911.dump`. Private transfer files (contain password hashes): `/private/tmp/dgt-store1-store2-source.json` and `/private/tmp/dgt-copy-store1-store2.sql` (0600). Copy ran in a guarded transaction with identity values preserved; sequences advanced to current max. No TRUNCATE/CASCADE used; unrelated brands reference row retained.
- Old test data replaced: users7, stores2, companies2, company_admins2, user_roles4, permissions8, store_role_permissions12, store_departments4, store_sub_departments3, store_business_hours3, lottery_settings1, access_audit_events16, user_sessions3, user_login_events3, departments34, role_types4, modules2. Other cleared configuration tables were empty. Old user-created demo account is retained only in backup.
- Imported from real dgt: one company (Store 1 Retail Company, company_id3); stores DGT-1017/STORE-001/Store1 and DGT-1018/STORE-002/Store2; users5; company_admins2; user_roles4; contact rows2; hours14; role preferences24; departments32; roles4; modules2. All original fields/IDs preserved, including user emails/password_hash, store name/legal/tax/license/timezone, contact phone/email/address and hours statuses. Real session/history data was not copied.
- Test schema added to match company structure: companies.primary_store_dgt_id varchar50; stores_company_dgt_unique UNIQUE(company_id,dgt_id); companies_primary_store_fk composite company/primary-store FK. Test-only session/history tables retained.
- Copied users: admin@dgt.test and admin@company1.dgt.test administer only the copied company; manager@company1.dgt.test has Stores1/2; cashier@store1.dgt.test and cashier@store2.dgt.test each see one assigned store. Passwords match current real accounts at copy time; future test changes are independent. No Company2 membership/users/stores copied.
- Frontend `backend.ts` defaults to backend8181 and session/profile mode enabled; `Index.tsx` removes test-preview redirect message and mounts live profile; `LoginPage.tsx` identifies Store1/2 development; `vite.config.ts` defaults to127.0.0.1:5173 with strict port. `Backend/run-development.sh` starts dgt_test explicitly with profile/session features. Real backend8182 remains separate and unchanged.
- Runtime: one Vite instance on5173. Old5174 address redirects to5173. Test backend8181 remains active.
- Validation: all five copied logins, assigned stores and own-profile API reads passed. Isolated Chrome on5173 displayed Store1, editable populated profile, actual login history/current session. TypeScript/build passed; existing bundle warning remains. Verification events are actual sign-ins.
- New development edits remain in dgt_test. Real release still requires user approval; 2FA and other previously deferred workflows remain pending.

- Post-copy regression: Maven verify passed all18 integration tests with the new test dataset and company-primary-store constraints. Browser verification session signed out; screenshot refreshed at `/private/tmp/dgt-profile-working.png`.

## 2026-09-11 — Profile editing buttons
- `Frontend/src/components/profile/UserProfileManagementPage.tsx`: name/email read-only until Edit; Update Profile and Cancel appear during editing. Successful name save exits editing; Cancel discards draft. Change Password initially shows only its opening button, then password fields with Submit/Cancel; Cancel clears password inputs. Existing verification/sign-out behavior retained.
- Test development only, localhost5173/dgt_test. No schema/backend or real DB changes. Isolated Chrome verified initial read-only state, Edit, both Cancel flows and Submit visibility without saving profile data. Verification sign-in/history and logout were actual test events. TypeScript and Vite build passed.

## 2026-09-11 — Password visibility controls
- User Profile Management: added independent eye toggles to current/new/confirm password inputs and the current-password field for email changes. Inputs start hidden; buttons have Show/Hide labels, pressed state and type=button. Closing the edit section resets visibility.
- File: `Frontend/src/components/profile/UserProfileManagementPage.tsx`. Frontend only; no API/schema/database changes. TypeScript and Vite build passed.

## 2026-09-11 — User Profile Management released to real dgt
- User approved releasing this page and its completed functionality to real dgt. Scope: self name/email updates; current-password-verified email/password changes; Edit/Update/Cancel and Change Password/Submit/Cancel; password eye toggles; real sign-in history; active sessions, logout and revocation. Two-factor authentication remains disabled. Other deferred business workflows are unchanged.
- Full backup: `Backend/backups/dgt_before_profile_release_20260911.dump`. Archive manifest verified at `/private/tmp/dgt-profile-backup-manifest.txt`. Applied guarded transactional release `Backend/db/releases/20260911_profile_sessions.sql`.
- Real DB new table `user_sessions`: session_id UUID PK, user_id bigint FK users, token_hash varchar64 NOT NULL UNIQUE, credential_fingerprint varchar64 NOT NULL, ip_address varchar64 NOT NULL, user_agent varchar512 NOT NULL, created_at/last_active_at timestamptz defaults CURRENT_TIMESTAMP, expires_at timestamptz NOT NULL, revoked_at timestamptz nullable; user index.
- Real DB new table `user_login_events`: event_id bigint identity PK, user_id bigint FK users, occurred_at timestamptz default CURRENT_TIMESTAMP, ip_address varchar64 NOT NULL, user_agent varchar512 NOT NULL, status varchar10 SUCCESS/FAILED CHECK; user/time index.
- No existing user/store/profile/password rows changed by migration; no test sample data or test history copied. Existing11 accounts/6 stores preserved. Profile operations now write existing users.first_name/last_name/email/password_hash/updated_at and revoke sessions on credential change.
- Real backend8182 restarted with app.profile.enabled=true and CORS for localhost5175. Current tested JAR used. Built frontend specifically for real API8182 with VITE_DATA_ENV=real and profile/session authentication enabled. Build artifact `/private/tmp/dgt-real-profile-ui`, served at localhost5175; LoginPage explicitly labels real dgt. `backend.ts`/`LoginPage.tsx` separate environment label from profile feature flag.
- Default development remains localhost5173 -> dgt_test8181 for Store1/2; old5174 redirects there. Real release is separately served at5175 so future source development does not automatically alter the real frontend build. No public hosting deployment performed.
- Validation: all11 real accounts successfully created sessions and read their own profile/history/current session; logout revoked each token and subsequent requests returned401. Actual verification login events retained with user-agent DGT profile release verification; verification sessions revoked. Browser check on real5175 verified Edit/Cancel, Change Password/Submit/Cancel and password eye show/hide; browser session signed out. No profile/password values changed during checks. TypeScript and real production build passed (existing bundle-size warning). Backend's18 integration tests passed previously against dgt_test; real verification was non-destructive.
- Pending: 2FA (user deferred), production authentication rate limits/history retention policy, and previously deferred business modules. Real page release complete.

## 2026-09-11 — Subscriptions & Billing test implementation

- Approved rules: per-store USD plans Basic60/Modern90/Advanced120 monthly; immediate plan selection change; upgrades invoice full difference now (not daily proration); downgrades no credit and lower rate at next renewal; cancellation at period end; company-admin only. Payment methods/add-ons remain blank.
- Backend new `billing/service/StoreBilling.java` and `billing/controller/StoreBillingController.java`; GET/POST `/api/v1/access/stores/{dgt_id}/billing`, enabled only by app.billing.enabled=true. Resolves dgt_id to existing stores.store_id FK internally. Company/admin scope checked, company/store locks serialize changes, optimistic versions and user/request UUID deduplication protect writes. Generic billing APIs remain blocked.
- Current-period committed amount prevents double charging after downgrade/re-upgrade: charged differences are cumulative only up to the highest plan price already invoiced that period. Invoice amounts remain DUE; no real payment collection or refund processing. Zero tax in test invoices explicitly labelled pending tax integration.
- Calendar policy used for testing: monthly subscription anniversary in store timezone; period_end is exclusive renewal/cancellation boundary; month-end anchor retained (Jan31 -> Feb28 -> Mar31). Scheduler checks every60seconds while billing-enabled backend runs, catches up elapsed periods, creates one invoice per renewal, and marks cancellation effective without a renewal invoice. No unsupported plan entitlements enforced; plan-to-module feature mapping remains to be specified.
- Backup: `Backend/backups/dgt_test_before_billing_20260911.dump`. Applied `Backend/db/proposals/20260911_store_billing_test.sql` to dgt_test only.
- Existing table `store_subscriptions`: added current_period_price numeric(10,2) NOT NULL default0/check nonnegative; cancel_requested_at timestamptz nullable; UNIQUE(store_id). Existing subscription_plan_id/status/start_date/current_period_start/current_period_end/next_billing_date/auto_renewal/cancelled_at/updated_at used by lifecycle.
- Existing `billing_invoices`: added subscription_id bigint nullable FK store_subscriptions, invoice_kind varchar20 CHECK INITIAL/UPGRADE/RENEWAL, plan_name_snapshot varchar50, currency varchar3 NOT NULL defaultUSD CHECK USD. Unique partial index(subscription_id,period_start) for INITIAL/RENEWAL. Existing invoice amounts/status/date/period fields store immutable due invoices. invoice_document_url stays null; downloads disabled.
- New `billing_change_requests`: user_id bigint FK users + request_key UUID composite PK, dgt_id varchar50 FK stores, action varchar20, plan_id bigint nullable, created_at timestamptz default current timestamp. Records request replay metadata; no card/payment details.
- `subscription_plans` seeded Basic60,Modern90,Advanced120; DB identities/default timestamps. Initialized Store1/DGT-1017 with Basic subscription and60 DUE invoice, Store2/DGT-1018 with Modern subscription and90 DUE invoice through scoped APIs. Each initial period starts on its store-local current date. Two START dedup records and SUBSCRIPTION_START audit events generated. No payment marked paid or collected.
- Frontend `SubscriptionsBillingPage.tsx` preserves cards and connects selected-store summary/plans/invoices; confirmation dialogs display due-now and next-renewal price, cancel confirmation period end, admin-only UI, explicit blank/unconnected payment/add-on state. `Index.tsx` connects billing route and passes store ID; `Backend/run-development.sh` enables billing on dgt_test.
- Validation:20 integration tests passed including upgrade60->90 invoice30, replay/stale request handling, no-credit downgrade, no double invoice when switching back, lower-price renewal, month-end dates, renewal replay, period-end cancellation and store/admin isolation. TypeScript and frontend build passed. Chrome verified Basic60 summary/DUE invoice, Modern upgrade preview30 and cancellation confirmation without submitting changes.
- Runtime: development5173/backend8181 uses dgt_test. Real dgt/backend8182 and built real frontend5175 unchanged.
- Pending: payment provider/cards, add-ons, tax rules, invoice documents/PDF, plan feature entitlements, reactivation/cancellation reversal, production scheduler operations/monitoring and real release approval. Billing scheduler only runs while development backend is running.


### 2026-09-11 — Subscriptions & Billing released to local real dgt
- Applied `Backend/db/releases/20260911_store_billing.sql` transactionally to real `dgt` after verifying that billing tables were empty. Backup: `Backend/backups/dgt_before_billing_release_20260911.dump`; pg_restore archive listing verified.
- `store_subscriptions`: added `current_period_price` (numeric(10,2), nonnegative, default 0), `cancel_requested_at` (timestamptz), and unique constraint on `store_id`.
- `billing_invoices`: added `subscription_id` (FK to store_subscriptions), `invoice_kind` (INITIAL/UPGRADE/RENEWAL), `plan_name_snapshot`, `currency` (USD); unique initial/renewal index on subscription_id + period_start.
- New table `billing_change_requests`: `user_id` (FK users), `request_key` (UUID), `dgt_id` (FK stores), `action`, `plan_id`, `created_at`; primary key (user_id, request_key) prevents duplicate requests.
- `subscription_plans`: inserted Basic $60, Modern $90, Advanced $120 monthly. No test subscriptions or invoices copied; each real store starts with Choose Plan. No payment collected or marked paid.
- Enabled StoreBilling service/API and renewal scheduler on real backend localhost:8182, preserving profile features. Published Subscriptions & Billing UI build at localhost:5175 from `/private/tmp/dgt-real-billing-ui`. Development remains localhost:5173 -> dgt_test.
- Validation: existing 20 integration tests pass; real frontend build passes (existing chunk-size warning). Real API returns three plans and empty billing data for company admin; manager, cashier and foreign-company admin return 403. Browser verified all plan options and Basic $60 due-now preview, then cancelled without saving.
- Remaining: payment provider/collection, payment methods, add-ons, tax rules, downloadable invoices, plan feature entitlements, reactivation/cancel reversal, and hosted deployment/operational setup. This is a local real-database release, not a publicly hosted deployment.


### 2026-09-11 — Add-on billing connected in TEST only
- Subscriptions & Billing: added Extra User ($10/month, one seat), Payroll Module ($30/month), Advanced Reports ($20/month). Starter prices are stored in billing_addons.monthly_price and can be revised later. No price-editor UI yet.
- Test migration: Backend/db/proposals/20260911_billing_addons_test.sql. Backup: Backend/backups/dgt_test_before_addons_20260911.dump.
- New billing_addons table: addon_id, code, name, description, monthly_price (nonnegative). New store_billing_addons: subscription_id (FK, cascading on subscription deletion), addon_id (FK), active, cancel_at_period_end, updated_at; composite primary key subscription_id/addon_id.
- billing_invoices.invoice_kind check expanded to accept ADDON. Existing invoice columns hold add-on name and charge snapshots; no new invoice columns.
- Company-admin-only add/cancel commands share store locks, subscription version checks, audit records and idempotency handling. Add creates a full monthly DUE charge immediately; renewal creates an add-on invoice alongside the base plan invoice. Cancellation stays active until period end; parent cancellation ends all add-ons. No refunds, proration or payment collection. One of each add-on per store; seat quantities pending.
- Existing billing_change_requests.plan_id holds the selected add-on ID for ADDON_ADD/ADDON_CANCEL actions (action distinguishes it from plan IDs).
- UI preserves Add-ons card, adds prices/status/action and confirmation/cancel controls; shows next renewal total including uncancelled add-ons. Each description clearly identifies pending feature functionality.
- Validation: 21 backend integration tests passed, including charge amount, request replay, renewal replay, cancellation, admin-only changes and store isolation; TypeScript and frontend build passed. Browser confirmed all three options and Extra User $10 preview without purchase.
- Real dgt and real UI5175 unchanged. Development backend8181/UI5173 serve add-on billing. Pending: real release after review, extra-user seat limit enforcement/quantities, payroll processing, advanced reporting screens, payment collection and add-on price editing UI. Buying an add-on does not yet unlock those unfinished features.


### 2026-09-11 — Add-on billing released to real dgt
- User approved real release. Backup: Backend/backups/dgt_before_addons_release_20260911.dump; pg_restore archive listing verified.
- Applied Backend/db/releases/20260911_billing_addons.sql transactionally with database guard and lock/statement timeouts.
- Real new table billing_addons: addon_id, code, name, description, monthly_price. Real new table store_billing_addons: subscription_id, addon_id, active, cancel_at_period_end, updated_at; primary key (subscription_id, addon_id), subscription and catalog foreign keys.
- Real billing_invoices.invoice_kind check now also accepts ADDON; no existing invoice data changed.
- Real reference rows: EXTRA_USER / Extra User $10, PAYROLL / Payroll Module $30, ADVANCED_REPORTS / Advanced Reports $20 monthly. No test purchases copied and no verification purchases made.
- Real backend8182 restarted with tested add-on code; UI5175 now serves /private/tmp/dgt-real-addons-ui. Development5173 remains connected to dgt_test.
- Validation: previously passed 21 integration tests; real frontend build passed (existing large-chunk warning). Real API verified all three prices, company admin 200, manager and foreign-company admin 403. Browser verified all three add-on names on real page.
- Remaining: payment collection, actual extra-user seat enforcement/quantities, payroll processing, advanced report functionality, and price editor. Add-on billing does not implement those unfinished features. Active base subscription required to add an add-on.


### 2026-09-11 — Billing plan buttons moved
- Subscriptions & Billing: moved Upgrade Plan / Downgrade Plan (or Choose Plan for an unsubscribed store) into the Current Plan card immediately after the payment-method summary. Removed the separate Plan Options card; existing actions and eligibility checks preserved.
- Updated development source and rebuilt real UI5175 snapshot. TypeScript and frontend build passed. No backend or database changes.


### 2026-09-11 — Workweek / Employees connected in test
- Existing Employees table, search, pagination, detail tabs and Add/Edit sheet preserved. Removed hardcoded employee/pay/tax/bank/document samples; unimplemented fields blank/disabled.
- Existing active users/roles for selected store are selectable. Optional new account uses existing account-creation validation and BCrypt, assigned CASHIER to current store and inherits that role's module permissions. Account creation and employee creation run in one transaction. No extra accounts were seeded merely for display.
- Added StoreEmployeesController with GET/POST /api/v1/access/stores/{store}/employees and PUT /{id}. Company-admin-only for this iteration, gated by app.workweek.enabled. Enabled only in run-development.sh/test tests. Real backend8182 and UI5175 unchanged.
- Connected employee hire date/type, assigned role, pay type/rate, assignment status. Optimistic version checks prevent stale edits. Company/user/employee locks prevent duplicate employee creation; foreign-store IDs rejected. Name/email are read from users; existing identities edited through profile/account workflows, not silently rewritten here.
- No new tables or columns. Existing writes: employees(user_id,hire_date,employee_type,updated_at); employee_store_assignments(employee_id,dgt_id,is_primary,effective_from,effective_to,role_type_id,updated_at); employee_compensation(employee_id,pay_type,hourly_rate,annual_salary,effective_from,effective_to,updated_at). New account path also writes users and user_roles via existing account API. access_audit_events records employee saves/user creation.
- Pay changes take effect on store-local current date, closing earlier compensation records; same-day current compensation replaced. Inactive assignment ends yesterday, requiring hire date before today. No user account or employee deletion. Existing multi-store employee records are blocked from editing/reassignment here pending a dedicated workflow; unsupported future/overlapping compensation scenarios need review.
- Fixed saved navigation to preserve a null profile-page selection when reopening Workweek. Employees now loads with selected store; other Workweek pages remain pending.
- Validation: 22 integration tests passed (including employee creation, update, stale edit rejection, duplicate prevention, store isolation, admin-only access and new CASHIER creation); TypeScript/frontend build passed. Browser verified existing-user dropdown and new-cashier form, Cancel without saving. Final empty dropdown option issue corrected and browser/TypeScript rechecked.
- Pending: Workweek role-based permissions/approvals; multi-store employee assignment; department/job-title mapping; tax/bank/deduction/document fields; attendance, schedule and time-off pages; configured overtime; user-seat enforcement; real release after review. No real DB changes.


### 2026-09-11 — Approved sample employee data in dgt_test
- Backup: Backend/backups/dgt_test_before_employee_samples.dump. Applied guarded script Backend/db/proposals/20260911_employee_samples_test.sql.
- Added 3 employees linked to existing users: company1 manager and Store1/Store2 cashiers; 4 employee_store_assignments (manager in both stores); 3 employee_compensation rows. Hire/effective dates 2026-01-01, Full-time, hourly sample rates: manager $25, cashiers $18.
- Columns populated: employees(user_id,hire_date,employee_type); employee_store_assignments(employee_id,dgt_id,is_primary,effective_from,role_type_id); employee_compensation(employee_id,pay_type,hourly_rate,effective_from). No new schema or login accounts; no real database writes.
- Verified Employees API returns two staff for each store. Manager is shared across both stores; editing shared employee records remains blocked pending multi-store workflow. Company admin accounts are not automatically staff.


### 2026-09-11 — Shared employee editing enabled in test
- Employees Edit now supports the shared manager. Hire date, employment type and pay are employee-wide; active/inactive assignment status affects only the selected store. Edit sheet explains scope and provides Save Changes/Cancel; existing account name/role remain managed by user settings.
- Added store_count to employee response and invalidation of employee queries across stores after saving. Backend verifies all employee assignments belong to the same company and administrator, retains optimistic version checks and rejects edits when future compensation records exist.
- No new DB tables/columns. Existing employee/assignment/compensation writes remain as documented above. No sample employee values changed during browser review. Real dgt/5175 unchanged.
- Validation: 23 backend integration tests passed, including shared-pay propagation, store-local status, stale edits and foreign-company assignment rejection. TypeScript/frontend build passed; browser confirmed manager edit scope message and Save Changes/Cancel.
- Supersedes earlier shared-manager-editing-blocked notes. Adding an existing employee to another store through the UI remains pending; this change edits already assigned employees.


### 2026-09-11 — Company admins added as test employees
- Approved after renewed confirmation. Backup: Backend/backups/dgt_test_before_admin_employees.dump. Applied Backend/db/proposals/20260911_admin_employees_test.sql to dgt_test only.
- Added 2 employees for admin@dgt.test and admin@company1.dgt.test; 4 employee_store_assignments link both to Store1/DGT-1017 and Store2/DGT-1018 with ADMIN role; 2 employee_compensation rows with sample $30/hour.
- Populated employees(user_id,hire_date,employee_type), employee_store_assignments(employee_id,dgt_id,is_primary,effective_from,role_type_id), employee_compensation(employee_id,pay_type,hourly_rate,effective_from). Dates 2026-01-01; employment type Full-time. No schema changes or changes to login credentials/company-admin access.
- API verified four employees per test store: two admins, shared manager, store cashier. Real dgt unchanged.


### 2026-09-11 — Employee name/email editing connected in test
- Existing employee Edit sheet now enables first name, last name and login email. Changes update linked users.first_name, users.last_name, users.email and users.updated_at; no schema changes.
- Email changes revoke active user_sessions via revoked_at. Password unchanged; user signs in using new email. Self-email changes return signInAgain and UI clears auth/cache and returns to login.
- Employee version now includes users.xmin; user row locked for identity changes. Name/email validation and duplicate-email rejection included. Identity changes require admin access to all companies linked through that account's store/roles/admin memberships.
- 24 backend tests passed, including new-email login, old-email rejection, session revocation, duplicate email and stale version checks. Frontend build/TypeScript passed; browser verified editable name/email fields and Cancel without changing sample credentials.
- Test backend restarted with feature enabled. Real dgt and UI5175 unchanged. Job title and department are still pending assignment schema mapping; no changes to account roles, payroll tax/bank/document fields.


### 2026-09-11 — Employee deposits, deductions, job title and department (TEST)
- Approved test migration: Backend/db/proposals/20260911_employee_details_test.sql. Backup: Backend/backups/dgt_test_before_employee_details.dump.
- employee_store_assignments added job_title varchar(100), department_id FK departments, store_department_id FK store_departments; check allows at most one department reference. Job title is separate from account role. API validates active default/custom department belongs to selected store; selection affects only that store assignment.
- New employee_deposit_instructions: employee_id PK/FK with cascade, bank_name, account_holder, account_type (Checking/Savings), account_last_four (4 digits), routing_number (9 test digits), active, is_test (required true), updated_at. Stores test instructions only, not full account numbers, provider tokens or payment capability.
- New employee_deductions: employee_id FK, deduction_type (with employee_id forms PK), calculation_type (FIXED/PERCENT), amount, frequency (PER_PAY_PERIOD), effective_from, effective_to, active, updated_at. Current UI/API supports fixed Health Insurance and percentage Retirement; validates nonnegative amounts, percentage <=100 and ordered dates. One current configuration per type; historical deduction versions not implemented.
- EmployeeDetails component integrated transactionally into employee create/edit/read; row version updated through existing employee/assignment writes. Admin-only, shared-employee company validation retained. Deposit/deduction configurations are shared across employee's stores; job title/department are store-specific. Omitted deposit/deduction input preserves existing configuration; deactivate using switches.
- Existing Employees UI tabs connected: job title, database department choices, test bank name/holder/type/last four/routing/active, health and retirement amounts/effective dates/active. View tabs show stored information and active status. Account roles unchanged.
- Validation: 25 backend tests pass (round-trip details, invalid department rejection, percentage validation, deduction deactivation plus prior employee/security tests), TypeScript/build pass; browser checked all detail tabs and Cancel. No real DB or UI5175 changes.
- Pending: real release review; secure payment-provider deposit integration (no full account storage), payment execution, payroll calculations, deduction history/additional types, tax/document fields, Workweek non-admin permissions/approvals, remaining Workweek pages.


### 2026-09-11 — Employees released to local real dgt
- User approved release and backup retry. Backup Backend/backups/dgt_before_employee_release.dump verified with pg_restore --list. Applied Backend/db/releases/20260911_employee_details.sql transactionally.
- Real employee_store_assignments: added job_title, department_id (FK departments), store_department_id (FK store_departments), employee_department_one constraint.
- Real new employee_deposit_instructions: employee_id PK/FK, bank_name, account_holder, account_type, account_last_four, routing_number, active, is_test, updated_at. is_test remains required true: fictional instructions only; no full bank account number/payment capability.
- Real new employee_deductions: employee_id FK, deduction_type, calculation_type, amount, frequency, effective_from, effective_to, active, updated_at; composite PK and amount/date checks. Exact SQL types in release migration.
- Real backend8182 runs profile/billing/workweek enabled; real UI5175 serves /private/tmp/dgt-real-employees-ui. Existing Employees create/edit, login identity edits, pay, store status, job title/department, test deposit and deduction instructions released.
- No test employee records, salaries, hire dates or deposit/deduction data copied. Real Employees starts empty; Add Employee links existing store-role users or creates a cashier. Existing company-admin employee samples remain test-only.
- Verification: prior 25 backend tests passed; real UI build passed with existing chunk warning. Real admin API 200 returns user/department choices; manager/foreign-company admin 403. Real browser Add Employee/existing-user/new-cashier form checked and cancelled without creation.
- Pending: real employee onboarding with actual approved employment data; company-admin selection in Add Employee (admins without store role assignments aren't in that dropdown); payroll tax/document/calculation features; real deposit-provider integration; Workweek non-admin permissions/approvals; additional multi-store assignment UI; schedule/attendance/time-off pages. This is a local real-database release, not hosted deployment.


### 2026-09-11 — Approved employee samples added to real dgt
- User explicitly approved copying tested employee setup for Store1/DGT-1017 and Store2/DGT-1018. Backup: Backend/backups/dgt_before_sample_employees.dump; archive listing verified. Applied Backend/db/releases/20260911_sample_employees.sql transactionally with table locks and duplicate guards.
- Added 5 employees linked to existing accounts: admin@dgt.test, admin@company1.dgt.test, manager@company1.dgt.test, cashier@store1.dgt.test, cashier@store2.dgt.test. Added 8 employee_store_assignments and 5 employee_compensation rows.
- Both admins and manager assigned to both stores; each cashier to their own store. Sample Full-time hire/effective date 2026-01-01; admins $30/hour, manager $25/hour, cashiers $18/hour.
- Columns populated: employees(user_id,hire_date,employee_type); employee_store_assignments(employee_id,dgt_id,is_primary,effective_from,role_type_id); employee_compensation(employee_id,pay_type,hourly_rate,effective_from). No schema changes, new login accounts, credentials changes, or deposit/deduction records. Stores3–6 unchanged.
- Real API verified four employees per store with expected sample rates. These employment dates/rates are sample data, not confirmed payroll instructions.


### 2026-09-11 — Employee-first website access workflow (TEST)
- User approved email as login ID and employee-first onboarding. Test backup: Backend/backups/dgt_test_before_optional_employee_login.dump. Applied Backend/db/proposals/20260911_employee_optional_login_test.sql.
- employees.user_id now nullable; added employees.first_name and last_name, backfilled from linked users, plus employee_identity_required check for unlinked employee names. employee_store_assignments.role_type_id now nullable. Existing accounts, permissions and employee links preserved.
- Workweek Add Employee now saves employee names/employment/pay/details without creating a login. Unlinked employees can be viewed/edited; linked names still read/write the login account as previously approved. Legacy existing-user API creation retained for compatibility, but removed from the new UI flow.
- Roles & Permissions now displays the store employee list, email ID, website role, access status and Add Access/Edit Access actions. Replaced Add User form and immediate role toggles in this panel. Company admins displayed with preserved company-admin access; ownership changes are not exposed here.
- Added EmployeeWebsiteAccessController GET /access/stores/{store}/employee-access and PUT /{employeeId}: admin-only, employee/store ownership validation, locked version checks, new email/password account creation via existing validation/BCrypt, linking employees.user_id, updating store user_roles and employee_store_assignments.role_type_id. New account employee code generated as EMP-{employee_id}. Role changes replace other active roles in this store; other stores unaffected.
- Add Access asks email, password and website role; Edit Access changes role/active status. Existing email edits remain in Employees; existing password changes remain in profile. Module access continues to inherit store role settings.
- Validation: 26 backend tests passed, including standalone employee create/edit, email login grant, login success, foreign-admin denial, duplicate/stale grant prevention and store access deactivation. TypeScript/frontend build passed; browser verified employee list and Edit Access dialog/Cancel without mutations.
- Real dgt and UI5175 unchanged. Release requires optional-login migration and backend/UI update. Payroll/payment/tax and other tracked Workweek items remain pending.


### 2026-09-11 — Employee access list corrected to requested layout (TEST)
- Roles & Permissions employee list now has only #, Employee Name, Job Type and Add User columns. Job Type displays store-assignment job_title when set, otherwise employee_type; it does not substitute a website role.
- Add User dialog uses employee's saved names; asks Employee ID, email, password and website role. No first/last-name fields. Backend accepts employeeCode, validated by existing account creation and stored in users.employee_id. Legacy API omission retains generated EMP-{id} fallback.
- Existing linked accounts show Edit User (role/active controls); company admins show disabled User Added to avoid duplicating/changing ownership access. Employees without accounts receive no website access until Create User succeeds. No existing access removed or added by this layout change.
- Validation: 26 backend tests passed, including explicit employee code persistence and optional-login flow; TypeScript/frontend build and browser four-column/dialog checks passed. No DB schema changes or real dgt/5175 changes.


### 2026-09-11 — Job Roles and automatic employee ID correction (TEST)
- Employee website access list: #, Employee Name, Job Roles, Add User. Job Roles reads employee_store_assignments.job_title only; blank when unset, no employment-type or website-role fallback.
- Removed Edit User from this list. Unlinked employees have Add User; existing accounts have disabled User Added to prevent duplicate accounts. No existing access removed.
- Add User dialog reuses employee names, displays read-only employees.employee_id, asks Email/Password/Role, shows store context and Create User/Cancel. No name entry or manual employee ID.
- Backend derives new users.employee_id from selected employees.employee_id converted to string, ignoring any caller-provided employeeCode. Existing account codes unchanged. No schema changes.
- 26 backend tests passed, including caller-supplied ID override ignored; TypeScript/build passed; browser verified Job Roles and removal of Edit actions. Test backend restarted. Real dgt/5175 unchanged.


### Non-admin Add User button correction (test)
- Add User is enabled for every non-admin employee, including linked accounts. Only company admins have a disabled Admin button. Existing logins are reused with email/password unchanged; role can be selected and saved through the existing endpoint. Unlinked employees enter email/password normally. TypeScript passed; browser verified both non-admin buttons open the form and Cancel works. Real UI unchanged.


### Employee account action labels corrected (test)
- Linked non-admin employees show Edit User / Save Changes; employees without accounts show Add User / Create User. Company-admin control remains disabled. TypeScript passed. No database changes.
- Employee ID shown in the form is employees.employee_id, the generated database key. Sequence gaps from prior inserts/tests are expected; this is not a row count or a manually assigned staff code.

- Test UI: Add User button now uses the purple primary style, white plus icon and rounded corners matching Add Employee. Edit User/admin buttons unchanged. TypeScript passed; no database changes.


### Employee-first access released to real dgt
- User approved production/local-real release. Verified backup: Backend/backups/dgt_before_employee_access_release.dump. Applied Backend/db/releases/20260911_employee_optional_login.sql.
- Real employees.user_id made nullable; added first_name/last_name and backfilled 5 existing records from users; added employee_identity_required check. Real employee_store_assignments.role_type_id made nullable. Existing employee/user links, credentials and roles preserved; no test employees copied.
- Real backend8182 restarted with tested optional-login code; real UI5175 now serves /private/tmp/dgt-real-employee-access-ui. Includes employee-first onboarding, Job Roles list, automatic read-only employee ID, Add User for unlinked employees, Edit User for existing accounts, and purple plus-icon Add User styling.
- Validation: prior 26 backend tests passed; real frontend build passed (existing large-chunk warning). Real employee-access API returns four linked employees for Store1; company admin allowed, manager and foreign-company admin denied. Browser checked real employee list and Edit User form/Cancel.
- Deposit/payment/payroll limitations and other pending Workweek items remain unchanged. Development5173 remains on dgt_test.

- Workweek navigation now defaults to Employees when clicked. Updated development source and real UI5175 build; TypeScript/build passed. No database changes.

### 2026-09-11 — Workweek schedules, availability, time off and coverage (test database)
- Scope: connected **Week Schedule**, **Time Off Request** and **Time Off Approvals**. Existing Employees default navigation remains. Development uses Store1/Store2 in `dgt_test`, UI `http://localhost:5173`, backend8181. This change has **not** been applied to real `dgt` or UI5175.
- Backend: added `workforce/WorkforceService.java` and `WorkforceController.java`, scoped under `/api/v1/access/stores/{dgt_id}/workforce`. Enabled only with `app.workforce.enabled=true`; added flag to `Backend/run-development.sh`.
- Frontend: added `Frontend/src/components/payroll/WorkforcePage.tsx`; connected these three views in `Frontend/src/pages/Index.tsx`. Schedule supports employee rows, week navigation, draft/published shifts, editing/cancellation, atomic copy-to-next-week, publish week, CSV and print. Dates/times use each store's timezone; overnight end dates are explicit, repeated DST times require an offset, nonexistent local times are rejected.
- Availability: recurring weekday windows/unavailable days and date exceptions require review. Latest effective weekday rule applies; date exceptions override it. Missing availability is unspecified. Availability changes flag conflicts rather than cancelling existing shifts; managers can schedule outside availability only with an override reason. Overlapping shifts across stores and approved time off cannot be overridden.
- Leave: request a date range or a specific published shift. Managers/admins may submit for employees without website access; staff can submit only for themselves. Managers/admins review staff requests; manager/admin requests need another company admin. Submitters and affected employees cannot approve their own requests. Pending requests can be cancelled; rejection needs a note. Approval marks affected shifts NEEDS_COVERAGE and snapshots actual scheduled duration/start dates, including weekends/overnight shifts. Without shifts, totals remain Awaiting schedule. Specific-shift leave does not block a separate nonoverlapping shift that day. No automatic paid-leave or payroll entry.
- Coverage/swaps: a named employee or open volunteer can accept coverage; swaps require the other employee's acceptance. Managers can record consent on behalf of employees without accounts, with a note. Selected recipients can decline. Reviewer approval rechecks availability, employment dates, overlaps and original shift versions, then reassigns one shift or both swap shifts atomically. Changes to a referenced shift invalidate the pending request rather than silently changing what was accepted.
- Validation/privacy: store/company access checked server-side; staff cannot create schedules or request for others. Staff roster omits pay/contact/login details; private request reasons are hidden from coverage recipients. Requests use idempotency keys; edits/reviews use row versions. Audit entries record mutations.

**Database changes actually applied to `dgt_test` only:**
- Backup: `Backend/backups/dgt_test_before_workforce.dump`.
- Migration: `Backend/db/proposals/20260911_workforce_test.sql`, guarded to reject other databases. Snapshot version columns were added in a follow-up ALTER during implementation and are included in the saved migration.
- `employee_schedules`: added `job_title varchar(100)`, `override_reason varchar(500)`, `published_at timestamptz`; added index `(employee_id,schedule_start,schedule_end)`. Existing start/end/work_date/status columns reused.
- `employee_time_off_requests`: added `dgt_id varchar(50)` referencing stores, `submitted_by bigint` referencing users. Existing request_type/start_date/end_date/reason/status/review/hours columns reused.
- `status_types`: inserted missing `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` values.
- New `workforce_requests`: `request_id`, `dgt_id`, `employee_id`, `kind`, `status`, `payload`, `shift_version`, `other_shift_version`, `submitted_by`, `request_key`, `leave_id`, `accepted_by`, `target_employee_id`, `reviewed_by`, `review_note`, `created_at`, `updated_at`. Foreign keys, kind/status checks, unique `(submitted_by,request_key)` and store/employee index.
- New `workforce_availability`: `availability_id`, `dgt_id`, `employee_id`, `kind`, `start_date`, `end_date`, `weekday`, `start_time`, `end_time`, `overnight`, `unavailable`, `request_id`. Foreign keys, weekday/date checks, unique request reference and employee/store/date index.
- New `workforce_leave_shifts`: `request_id`, `schedule_id`, `employee_id`, `work_date`, `start_at`, `end_at`. Foreign keys and composite request/schedule primary key.
- Integration tests create isolated fixtures and remove them afterward; no test fixtures copied to real stores.

**Verification:** Maven verify passed: 26 existing access tests plus 7 new workforce integration tests (permissions/isolation, overnight and DST duration, weekend leave, unscheduled leave, hierarchy/self-approval denial, coverage consent, availability overrides, swap/decline/stale requests, copy/publish, specific-shift regression and malicious payload validation). Frontend build passed with existing bundle-size warning; browser verified schedule, overnight fields, availability and swap forms. TypeScript passed; browser also verified the time-off request form and its specific-shift option.

**Remaining boundaries:** real release awaits page review; attendance/time clock, paid leave balances/accrual, breaks/payroll calculations, automatic roster generation, notifications, partial-shift hourly leave, and reversal of already-approved leave are not implemented here. Weekly availability is entered one weekday at a time. Request lists show the latest 1,000 records per store. Existing published shifts require an explicit leave/coverage/cancellation action; availability alone does not remove them.

### 2026-09-11 — Restore original Workweek UI around connected features
- User requested matching the original UI after the workforce implementation changed its presentation. Used the existing `WeekSchedulePage.tsx`, `TimeOffRequestPage.tsx` and `TimeOffApprovalsPage.tsx` as the visual reference.
- Updated `WorkforcePage.tsx`: original compact schedule grid, muted headers/alternating rows, colored shift tiles, empty-cell plus buttons, total-hour badges, four summary cards, compact toolbar/week navigator, and right-side Add/Edit Shift sheet. Cell plus buttons preselect employee/date; clicking a shift opens its editor.
- Restored time-off table columns, status badges, icon approval/rejection actions, empty-state icons, original-style dialogs/dropdowns, textarea reason and Pending/All Requests approval tabs. Kept availability/coverage tabs, publish action and required overnight/date inputs connected to the existing APIs.
- OT Employees remains blank because overtime policy/calculation is not implemented; Undo remains disabled because saved-schedule undo is not implemented. No sample employee names, shifts, paid overtime or leave totals were reintroduced.
- Frontend-only change in development UI5173. No backend, test database, real database or real UI5175 changes.
- Build passed with existing large-bundle warning. Browser checked restored summary cards, right-side sheet, availability and swap forms; schedule screenshot visually reviewed.
- Final verification: TypeScript passed; browser selected an employee in the styled dropdown and verified the time-off form/table and Pending/All Requests filter. No records saved during these browser checks.

### 2026-09-11 — Add Shift validation and default-date correction (test UI)
- Reproduced employee selection with browser mouse clicks. Screenshot showed no employee selected, causing the previous Save Shift button to be silently disabled.
- Save Shift now reports a clear missing-employee message; blank dates/times also receive validation. New shifts default to the next future 09:00 in the store timezone rather than today's already-past 09:00. Selecting an employee fills their saved store job title where available.
- Successful saves navigate to the shift's week so a shift entered outside the displayed week is visible immediately. Original layout preserved.
- Verified actual browser save for Cashier Store1 on 2027-01-12 in dgt_test, displayed the saved tile, reopened it and cancelled it. Test schedule row remains CANCELLED with audit entries; no active sample shift remains. No schema or real dgt changes.
- TypeScript passed; browser validated missing-employee guidance, real mouse selection, save, week navigation and cancellation.

### 2026-09-11 — Availability and swap verification/guidance (test UI)
- User reported both pages not working. Reproduced opening both tabs with real browser mouse events; both rendered. No submission failure reproduced.
- Submitted weekly availability for Cashier Store1 through the UI; verified PENDING row and cancelled that test request through the UI. Explained that approved availability stays empty until another eligible reviewer approves.
- Added explicit missing-employee and missing-shift validation instead of disabling Submit without explanation. Submission now states pending approval and that the submitter cannot approve their own request.
- Coverage tab explains selected-week/published-shift prerequisites, acceptance and separate approval. An empty week now tells the user to publish shifts or navigate to the appropriate week. Swap/time-off selectors exclude NEEDS_COVERAGE shifts; those are available only for coverage requests, matching backend validation.
- Full swap verification: created two temporary published shifts in dgt_test for Cashier Store1 / Manager Company1 (2026-09-14 and 2026-09-15, 03:00–04:00), submitted swap through UI, accepted via manager API and approved via separate company-admin API. Verified both employee assignments exchanged, then cancelled both temporary shifts. Test request/audit rows remain; no active temporary shifts remain.
- Frontend-only implementation changes; no schema or real dgt/5175 changes. Development continues at localhost:5173. TypeScript passed; full browser submission/decision checks above passed.

### 2026-09-11 — Unavailability Date and swap week selection (test UI)
- Removed Weekly Availability creation from the page. Renamed Date Exception to Unavailability Date. New EXCEPTION requests set `unavailable=true` and show employee/date range/reason only, without available-time/overnight controls. The Availability tab now lists date exceptions only; existing weekly records are preserved in the database/history.
- Swap dialog now says Swap Shift and explains recipient acceptance/approval instead of irrelevant leave/payroll text. Added an in-dialog week date selector, normalised to Monday. Changing weeks clears selected shift IDs and keeps the dialog open while fetching. Submission is disabled during refresh.
- Shift options exclude already-started shifts. Dialog explains when the selected employee or other employees have no published shifts in that week. Only published shifts are swap candidates; coverage continues to allow NEEDS_COVERAGE.
- Verification: browser submitted/cancelled an Unavailability Date request and confirmed old weekly/time controls absent. Browser changed week inside swap dialog and submitted a real test swap; manager acceptance and separate-admin approval exchanged both shifts. Temporary shifts cancelled afterward. Test request/audit rows retained; no real dgt or schema changes.
- Updated only Frontend/src/components/payroll/WorkforcePage.tsx and documentation. Development UI5173; real UI5175 unchanged.

### Time-off approval action label (test UI)
- Replaced the icon-only approval action with a visible check icon + Approve button in WorkforcePage.tsx. Opens the existing confirmation dialog and approval API for eligible pending requests. Existing reviewer restrictions and self-approval prevention preserved. No database changes; development UI5173 only.

### Approval visibility clarification (test UI)
- Pending requests now show Approve even when can_review=false, disabled with an explanation that another eligible approver is needed. Eligible reviewers retain the enabled approval action and confirmation. Existing server-side self/submitted-request approval restrictions unchanged. No database changes.

### 2026-09-11 — Admin automatic approval and employee review policy (test)
- Updated workforce approval rules at user request: a request for a company-admin employee, submitted by a company admin, approves automatically. Requests for other employees remain pending, including requests an admin enters on their behalf.
- Company admins may review all requests within their company, including pending requests they submitted. Managers retain staff-only review and cannot approve their own/affected-employee requests; manager requests still require admin. Ordinary employees do not gain approval authority.
- Admin requests involving coverage/swaps still await recipient acceptance. Admin authorization is recorded using existing workforce_requests.reviewed_by; after acceptance, the transaction applies the change automatically only if the authorizing admin is still active. Shift versions, availability, overlaps and consent checks remain enforced. Auto-approval records the admin as reviewer.
- Reused existing request/status/reviewer/leave/availability/audit columns; no schema migration. Existing pending records are not bulk approved; admins can now approve them through the button.
- Frontend reads the returned request status and distinguishes automatic approval from pending requests. Updated explanations to reflect the new policy. Changes restricted to test runtime8181 / UI5173; real database/runtime unchanged.
- Validation/restart: Maven verify passed (26 access + 9 workforce tests), TypeScript and frontend build passed. Test backend8181 restarted with updated code. Browser confirmed all three currently pending requests show enabled Approve for the signed-in admin and open confirmation; closed without changing those requests.

### 2026-09-11 — Pause coverage/swaps; simplify Time Off Request actions
- Disabled Request Coverage and Request Shift Swap buttons and displayed the paused state. Existing swap/coverage acceptance, decline and approval controls are suppressed; pending request cancellation remains available to the requester.
- Backend defaults app.workforce.shift-changes.enabled=false. New coverage/swap requests and decisions other than cancellation are rejected while disabled. No existing requests/shifts are deleted or automatically changed.
- Time Off Request Actions now shows request status and Cancel for eligible pending requests only. Approve/Reject remain in Time Off Approvals, with existing role rules.
- No schema or real database changes. Updated test runtime only; tests explicitly enable shift changes to retain regression coverage and separately verify the paused state.
- Verification: Maven verify passed (26 access + 10 workforce tests), TypeScript/build passed. Test backend restarted. Browser confirmed Time Off Request Actions show Pending/Cancel without Approve and both coverage/swap buttons are disabled. No user requests changed during browser checks.

### 2026-09-11 — Workweek workforce release to real dgt / UI5175
- User explicitly requested production release. Preflight confirmed real employee_schedules and employee_time_off_requests contained zero rows and the workforce additions were absent. Existing employees/store/account data preserved; no test shifts, requests or availability copied.
- Full backup: `Backend/backups/dgt_before_workforce_release.dump`; pg_dump completed and pg_restore --list verified the archive is readable (758 TOC entries). Applied `Backend/db/releases/20260911_workforce.sql` in one transaction with real-dgt guard and lock/statement timeouts; COMMIT succeeded.
- Real `employee_schedules`: added `job_title varchar(100)`, `override_reason varchar(500)`, `published_at timestamptz`; index `(employee_id,schedule_start,schedule_end)`.
- Real `employee_time_off_requests`: added `dgt_id varchar(50)` FK stores and `submitted_by bigint` FK users.
- Real `status_types`: inserted missing PENDING, APPROVED, REJECTED, CANCELLED (4 rows).
- New real `workforce_requests`: `request_id`, `dgt_id`, `employee_id`, `kind`, `status`, `payload`, `shift_version`, `other_shift_version`, `submitted_by`, `request_key`, `leave_id`, `accepted_by`, `target_employee_id`, `reviewed_by`, `review_note`, `created_at`, `updated_at`; foreign keys/checks, unique submitter/request key and store/employee index.
- New real `workforce_availability`: `availability_id`, `dgt_id`, `employee_id`, `kind`, `start_date`, `end_date`, `weekday`, `start_time`, `end_time`, `overnight`, `unavailable`, `request_id`; foreign keys/checks, unique request and employee/store/date index.
- New real `workforce_leave_shifts`: `request_id`, `schedule_id`, `employee_id`, `work_date`, `start_at`, `end_at`; foreign keys and composite request/schedule primary key.
- Real backend8182 restarted using verified JAR with profile, billing, workweek and workforce enabled, and `app.workforce.shift-changes.enabled=false`. Real frontend5175 now serves `/private/tmp/dgt-real-workforce-ui`, built with `VITE_API_BASE_URL=http://localhost:8182/api/v1`, `VITE_DATA_ENV=real`, profile enabled. Prior frontend snapshot `/private/tmp/dgt-real-employee-access-ui` retained.
- Released original-style schedule grid/summary cards/side editor, shift CRUD/publish/copy, Unavailability Date, Time Off Request status/cancellation and Time Off Approvals. Weekly creation removed. Admin requests submitted by an admin auto-approve; staff requests stay pending and admins can approve even if entered on their behalf. Coverage and swaps remain off in both UI and API.
- Validation: prior 26 access + 10 workforce tests passed; real frontend build passed with existing bundle-size warning. Real workforce GET200 for admin, manager and cashier; foreign-company admin403. Both COVER and SWAP POSTs rejected with paused message before any record insert. Real Store1 workforce returned five employees and zero requests/shifts. No test records created in real dgt during verification.
- Rollback path: disable workforce flag and serve retained previous UI snapshot while retaining additive schema/data; archive available if a separately reviewed database restore is required. Development5173 continues using dgt_test.
- Still outside scope: attendance/timeclock, payroll/break/paid-leave calculations, approved-leave reversal and automatic roster generation. No external payment processing enabled by this release.
- Final real browser check passed on localhost:5175: Time Off Request loads its empty real-data state without approval controls, Week Schedule opens, and both coverage/swap buttons are disabled. Login verification records normal session/login-history activity only.

### 2026-09-11 — Employee-specific schedule colors (live UI)
- Shift cards now use a stable pastel background, matching border and dark text derived from employees.employee_id. Colors remain consistent across weeks, stores and job-role changes; different employee IDs receive different hues. Replaced job-role-based colors. NEEDS_COVERAGE retains an amber outline and status text.
- Frontend-only WorkforcePage.tsx change. TypeScript and production build passed. Live UI5175 now serves `/private/tmp/dgt-real-workforce-colors-ui`; previous snapshot retained. No backend/database changes or sample shifts inserted. Development source includes the same styling.

### 2026-09-11 — Price Book inspection / attendance deferred
- Recorded user decision to defer Time & Attendance until POS.
- Inspected existing Price Book components and product/pricing/barcode/inventory Java models plus current access controls. Added docs/PRICE_BOOK_INSPECTION.md with current data sources, field mapping candidates, gaps and proposed page order.
- Documentation-only change; no UI redesign, backend/database changes or release.

### 2026-09-12 — Price Book store-isolation preparation (not applied)
- User confirmed every store must have separate Price Book data.
- Initial dgt_test inspection found global uq_products_sku and uq_product_barcode_value constraints, products owned indirectly through store subdepartments, and no store ownership on vendors. Products count was zero.
- Prepared Backend/db/proposals/20260912_pricebook_store_isolation.sql: store ownership on subdepartments/products/barcodes, store-specific SKU/barcode uniqueness and composite foreign keys preventing cross-store department/price/inventory links.
- Draft only: no schema changes applied and no application code connected. Additional test-table count/constraint inspection was rejected by the user, so database work stopped. Vendor ownership and its existing data still need inspection before a vendor migration or scoped editing can be prepared.

### 2026-09-12 — Price Book duplicate codes and vendor ownership proposal
- User clarified SKU/barcode values need not be unique. Revised the draft to remove global uniqueness without adding store-level code uniqueness; ordinary store/code indexes support lookup. Product IDs remain unique.
- Approved read-only test inspection confirmed vendors is empty and inspected inventory/product-vendor constraints.
- Draft adds dgt_id to store_sub_departments, products, product_barcodes, vendors and product_vendors, plus composite ownership foreign keys for department, barcode, vendor, price and inventory links. It aborts if vendors contains records needing ownership mapping.
- No database changes applied. Proposal awaits approval before test execution; Items UI/API integration remains pending. Real dgt is unchanged.

### 2026-09-12 — Accepted store-specific item code rule
- After explaining manufacturer barcodes and internal SKUs, user accepted allowing identical codes across stores while keeping each code unique within a store.
- Updated the draft to use UNIQUE(dgt_id,product_sku) and UNIQUE(dgt_id,product_barcode_value), superseding the non-unique indexes proposed above.
- File changes only; test and real database schemas remain unchanged. Test migration execution awaits approval.

### 2026-09-12 — Price Book store-isolation migration applied to test
- User approved execution. Applied Backend/db/proposals/20260912_pricebook_store_isolation.sql with ON_ERROR_STOP inside a transaction; COMMIT succeeded on dgt_test.
- Added required dgt_id columns to store_sub_departments, products, product_barcodes, vendors and product_vendors. Backfills updated zero rows.
- products: replaced uq_products_sku with UNIQUE(dgt_id,product_sku). product_barcodes: replaced uq_product_barcode_value with UNIQUE(dgt_id,product_barcode_value).
- Added composite identity keys on store_departments, store_sub_departments, products and vendors. Added ownership foreign keys for subdepartment-to-department, product-to-subdepartment/store, barcode-to-product, vendor-to-store, product-vendor-to-product/vendor, product_store_prices-to-product and inventory-to-product.
- No new tables, sample records, or real dgt changes. Read-only verification confirmed all five required columns, both store-specific code constraints and all ownership constraints; old global code constraints are absent.
- Items API/UI and end-to-end tests remain pending. Existing write paths must supply the new required ownership columns before this feature is ready for use. This is a one-time migration, not a repeatable script.

### 2026-09-12 — Price Book Items implementation prepared; permission migration blocked
- Replaced ItemsPage sample/Supabase item data with store-keyed Java API requests. Preserved the table/drawer layout; wired name, SKU, displayed barcode, active department/subdepartment, retail, tax, EBT, returnability and active status. Item creation materializes selected default department/subdepartment ownership only in the selected store. Product IDs identify edits; xmin versions reject stale updates.
- Added conditional PriceBookController endpoints under /api/v1/access/stores/{store}/items and ITEM_CREATE/ITEM_UPDATE dispatch in ApprovalService. Added PRICE_BOOK access definitions/context and role permission UI actions. Test launcher enables app.pricebook.enabled; default remains disabled. Running servers were NOT restarted.
- Unimplemented cost breakdown, case/unit rules, age restrictions, reorder levels, price groups/promotions, stock editing, Export, Delete and Send to POS remain disabled/blank. Existing inventory quantity is read-only. Vendor selection/editing remains pending. No parent/child sync.
- Applied test-only 20260912_pricebook_module.sql: inserted one modules row (PRICE_BOOK), using its generated module_id. First attempt supplied module_id and rolled back; corrected attempt committed. No role grants created by this seed.
- TypeScript check and frontend build passed before final cleanup; TypeScript passed again after cleanup. Backend integration suite passed 27 scoped-access tests plus 10 workforce tests before extending the item test to include approval. Item assertions covered persistence, duplicate-in-store rejection, same codes across stores, stale/cross-store edits and cross-store price FK rejection.
- Extended approval test exposed store_role_permissions_permission_code_check rejecting PRICE_BOOK_VIEW. Latest suite: 27 scoped-access tests with 1 error, 10 workforce tests passing. This is not release-ready.
- Prepared 20260912_pricebook_permission_codes.sql to retain the current check and allow PRICE_BOOK_VIEW/EDIT. User declined its execution; NOT APPLIED. Pending: apply approved permission migration, complete approval-flow tests, browser validation and restart test server. Real dgt/backend8182/UI5175 unchanged. No production release.

### 2026-09-12 — Price Book admin/manager access enabled in test
- User confirmed Price Book is restricted to company admins and store managers, with one access toggle that includes viewing/editing. Cashiers and accountants cannot access it.
- ScopedAccess now enforces PRICE_BOOK_ACCESS only for active assigned managers; company admins retain company-scoped access. RoleAccessController rejects granting this code to other roles. StoreRoleMatrix shows one Price Book Access row, manager toggle, admin full access and No access for cashier/accountant. Existing manager approval policies remain supported.
- With approval, applied revised 20260912_pricebook_permission_codes.sql to dgt_test: extended store_role_permissions_permission_code_check for PRICE_BOOK_ACCESS, preserving all previous codes. No PRICE_BOOK_VIEW/EDIT permissions added and no user grants seeded.
- Updated integration test covers manager denial before grant, successful view/create after grant, cross-store denial, rejection of cashier/accountant grants and denial even if incorrect grants exist in the database. Existing item persistence, duplicate-code, stale-update and ownership checks remain covered.
- Validation: 27 scoped-access plus 10 workforce integration tests passed; TypeScript and frontend build passed. Browser check on localhost:5173 confirmed Items/Add Item drawer, SKU field and Create Item action load correctly; this browser check did not create records.
- Restarted test backend8181 with app.pricebook.enabled=true; UI5173 uses the updated source. Real database/backend8182/UI5175 unchanged. Deferred item fields/workflows from the prior entry remain pending; not a full Price Book release.

### 2026-09-12 — Remaining Add Item fields proposal
- Prepared docs/PRICE_BOOK_ITEM_DETAILS_PLAN.md with exact field mappings, dollar-discount/item-case calculations and validation scope.
- Prepared unapplied test-only 20260912_pricebook_item_details.sql: products.is_age_restricted, reorder_level, purchase_unit, units_per_case, purchase_gross_cost and purchase_discount, with validation constraints. Nullable fields preserve unknown existing values.
- Proposed reuse of store-scoped vendors/product_vendors; inventory quantities and inventory valuation remain unchanged. No database or application changes applied in this step; awaiting approval of proposal.
