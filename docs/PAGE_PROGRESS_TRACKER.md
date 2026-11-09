# Page progress tracker

Detailed implementation and exact real/test database changes: [Project change log](CHANGE_LOG.md).

Update this document at the end of each page: completed scope, deferred items, verification, and release status. Preserve existing page layouts; leave unimplemented values blank. Work in dgt_test first. Real database migrations and production releases require explicit approval after review and backup.

## Store Account Overview

**Status:** Finished for now in the test preview; user requested moving on and returning to deferred items later.
**Last updated:** 2026-09-10
**Release status:** Store Account Overview database migration applied to real dgt with user approval. Application deployment/switch from dgt_test is still pending.

### Completed in test preview

- Restored the original cards and edit dialog.
- Store Name and DBA Name share stores.store_name.
- Store ID displays the franchise/reference ID (stores.store_id).
- DGT Account Number displays stores.dgt_id.
- Legal business name, tax ID, and license number are connected.
- Created Date displays stores.created_at, using the store timezone when assigned.
- Address, Phone, and Store Email ID connect to store_contact_info by dgt_id.
- Shared Support Contact Email is support@dgtinnovations.com for every store.
- Searchable worldwide timezone selector saves each store's IANA timezone.
- Weekly business hours support scheduled hours, overnight intervals, closed days, open 24 hours, and blank/unassigned days.
- Store details, contact information, and hours save transactionally, with stale-version checks. Duplicate contact records produce an issue rather than silently selecting one.

### Deferred — return later

- Subscription Status: connect to subscription data; define which subscription is current if necessary.
- Account Status: version 2; currently blank.
- Last Login: define and implement the relevant login tracking and display.
- Connected Devices: entire section deferred (POS status, last sync, sync frequency, terminal count); values remain blank.
- Holiday hours and multiple opening intervals per day are not implemented; revisit if needed.

### Verification and release work still pending

- User/browser review of editing, reload persistence, store switching, timezone search, and hours controls.
- Current test stores had no contact records at the last read-only check; blank contact fields are expected. Temporary API fixtures previously verified contact save/read behavior and were removed.
- Backend package, frontend build/TypeScript, and live API tests passed for the implemented flows. Interactive browser testing has not been completed.
- Finalize production authentication and company/store permissions and approval workflows; preview still uses HTTP Basic and an allowlisted schema administrator. Refresh requires signing in again.
- Review write coordination with legacy generic CRUD endpoints before production release.
- Back up the real database and review/apply approved migrations only with user permission:
  - Backend/db/proposals/20260910_store_timezones_departments.sql
  - Backend/db/proposals/20260910_business_hours.sql
- Review legacy records and validate pending NOT VALID constraints before release; do not infer ambiguous business hours or department ownership.
- Deploy matching frontend/backend code and verify against the real database after migration approval. Completion of the test page is not production approval.

### Supporting notes

- Backend/docs/STORE_TIMEZONE_DEPARTMENTS.md
- Backend/docs/BUSINESS_HOURS.md
- Frontend/TEST_PREVIEW.md (initial integration notes; this tracker reflects the later completed contact/hours work).

## Next page

Not selected yet.

## Store Account Overview — real database migration completed

- Applied Backend/db/releases/20260910_store_account_overview.sql with explicit user approval.
- Backup: Backend/backups/dgt_before_store_account_20260910.dump; archive listing verified readable.
- Added stores.timezone and its validation trigger.
- Added store_business_hours.status; opening/closing times now nullable for non-scheduled statuses. Business-hours constraint is validated.
- Verified unchanged counts: 9 stores, 0 contact rows, 0 business-hours rows. All nine store timezones remain unassigned; no values were guessed or test data copied.
- No department migration was applied. Do not apply the earlier combined proposals unchanged: they would repeat these column additions.
- The UI still uses the dgt_test preview. Production backend compatibility (including its separate department schema expectations), deployment, authentication, and browser review remain pending.

### Connection-switch compatibility finding

Read-only check completed; see BACKEND_COMPATIBILITY.md. Current backend startup is blocked by missing real store_sub_departments.source_type. Two store_departments settings also differ. Resolve with separately approved department migration or a compatible backend version; no connection switch has occurred.

### Department schema blocker resolved

Approved migration Backend/db/releases/20260911_department_sources.sql applied to real dgt after a fresh backup. All 77 generated column/type definitions now match; department defaults/nullability and constraints verified. Earlier missing-column findings are resolved. Application connection remains on dgt_test; real authentication, startup and browser verification remain pending. Exact changes are in CHANGE_LOG.md.

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

## Access & Integrations — Department Access

Status: Add Department implemented in test preview; page still in progress.

- Store-specific custom department creation and list refresh complete; shared defaults loaded from database.
- API isolation/duplicate tests and builds passed; temporary data cleaned up.
- No database migration or real-data changes for this task.
- Pending: browser review, status toggle persistence, subdepartment UI, real company/store permissions and approvals. Roles and integration tabs remain outside this completed task.

### Original default catalog restored

Test preview now includes all original 32 departments and 453 subdepartment entries, with expandable lists. Default department rows are seeded in dgt_test; shared subdepartment hierarchy comes from the backend catalog file. Existing custom departments remain store-scoped. Builds and exact API catalog comparison passed. Real database unchanged; browser review and production catalog release pending.

### Department status toggles completed in testing

Active/Inactive now persists per selected store for shared defaults and custom departments. No deletion action; inactive rows remain listed. API persistence/isolation/stale/deletion checks passed, as did builds. Previous status-toggle-persistence pending item is resolved. Remaining: browser review, use of status on other module screens, custom subdepartment UI, roles/approvals, production release. No real database changes.

## Roles & Permissions

Proposal prepared; not implemented/applied. See ROLES_PERMISSIONS_PLAN.md and the guarded test migration. Next: review proposal, approve test application, inspect/prepare explicit test company/store/admin mappings, then implement scoped access and approval flows. No database changes yet.

### Roles & Permissions — test implementation completed

- Migration and explicit test company/account bootstrap applied only to dgt_test.
- Company/store access, per-user role assignments, module view/edit grants, manager approval settings, and request submit/review/approve/reject/cancel implemented for Store Account Overview and Department Access.
- Accountant defaults read-only; cashier/edit-enabled accountant changes await manager/company-admin approval; manager policy configurable.
- Generic backend routes denied; unconnected UI pages show an unavailable message rather than mount unscoped legacy flows. Layout source remains intact. Existing connected pages preserved.
- 11 integration tests and frontend checks passed; all five test logins verified on running preview.
- Pending: browser review, remaining modules and their approval handlers, company-admin management and audit-review interfaces, production session/authentication, explicit real company memberships and separately approved migration/release.
- New access schema exists only in dgt_test. Earlier statements that real dgt matches the latest source are superseded for this new build.
- Review instructions and accounts: ROLES_PERMISSIONS_TESTING.md. Exact schema/data/files: CHANGE_LOG.md.

### Roles & Permissions — Add User, 2026-09-11
- Implemented/tested: combined account creation + role/store assignments + explicit module view/edit permissions in `dgt_test`; existing page layout retained.
- No schema or real DB changes. Manager can select multiple company stores; cashier/accountant current store only.
- Pending: browser review, invitation/reset workflows, company-admin management, other modules, production release.

### Roles & Permissions — store user list
- Finished: selected-store user-role list with status and per-assignment Edit Access dialog; new accounts appear after creation.
- Verified: TypeScript and production build. Pending: manual browser review. No DB changes.

### Roles & Permissions — current behavior: store role matrices
- Supersedes individual Edit Access: edit permissions in Store/Grocery/Lottery tables by role. Users inherit access; individual list controls active status.
- Completed in dgt_test: persisted role settings, authorization for Store Account Overview/Departments, inheritance, audit, migration/backup, 14 passing integration tests, frontend checks.
- Pending: enforce saved Grocery/Lottery action settings when their business workflows are implemented; browser review; real DB release; invitations/password reset.

### Permission table editing
- Finished: Edit enables local draft; Save Preferences saves atomically; Cancel discards draft. Frontend checks and 15 backend integration tests pass.
- Pending: manual browser review. No schema or real DB changes.

### Real dgt release — in progress
- Backup verified; role/approval/store-role schema and default department reference data applied.
- Pending user input: company grouping and admin ownership of existing real stores. Required before scoped store access and preview cutover can complete.

### Real dgt cutover — completed 2026-09-11
- Ownership resolved by user-approved replacement: Store 1 company owns Stores 1–2; Store 3 company owns Stores 3–6. Main-store relationships persisted. Preserved admin manages both.
- Old ten stores/contact/hours backed up and replaced with six sample stores; role schema/catalog preserved. Preview now uses real dgt on backend 8182.
- All six stores passed read-only API smoke checks; frontend build/type checks passed.
- Still pending: browser review, real business details replacing sample values, Integrations/API and previously deferred workflows. Earlier ownership-mapping blocker is resolved.

### Company/store account setup completed
- Real dgt now has 11 users: preserved shared admin, two company admins, two company managers, six store cashiers.
- Every login, exact store assignment, current permissions and cross-store restriction verified.
- Existing deferred workflows unchanged; user credentials delivered privately rather than in repository documentation.

### User Profile Management — test version ready
- Implemented: own first/last name and email, current-password-verified email/password changes, validation and sign-in after credential change. Original cards retained.
- No schema/real-data changes; isolated test preview localhost:5174. All16 backend tests and frontend checks passed.
- Pending: user browser review and real release approval; 2FA, login history, sessions, audit trail deferred.

### Admin navigation
- Admin can open existing layouts for all pages within their selected company store. Implemented pages work normally; unfinished layouts are inert and marked as examples. Legacy Supabase requests/subscriptions blocked.
- Pending: replace hardcoded examples with empty states page by page; browser navigation review. No DB changes.

### User Profile Management — history and sessions implemented in test
- Five sample profile names populated; user-created account preserved.
- Real session tokens, successful/failed known-user login history, active device/IP listing, revoke/logout and credential-change invalidation implemented. MFA deferred.
-18 integration tests and frontend checks passed; live revocation smoke passed. Manual review on localhost:5174 and real release remain pending. Real dgt unchanged.

- Profile blank-state report: real preview now explains test-only availability instead of empty inputs. Fresh Chrome test-preview sign-in confirmed populated fields/activity/session. User-specific blank state on5174 remains unconfirmed; screenshot saved.

### Development workflow consolidated
- Completed: Store1/2 + five associated users/config copied into dgt_test, old demo dataset backed up/replaced. One default URL localhost:5173;5174 redirects.
- Browser verified live User Profile Management fields/activity/session; five copied accounts pass API checks.
- All future development stays in dgt_test; real dgt unchanged. Earlier separate-preview instructions are superseded.

- Profile editing controls completed and browser-verified: Edit -> Update Profile/Cancel; Change Password -> Submit/Cancel. No real DB changes.

- User Profile Management: show/hide eye buttons added to password fields; hidden by default. Frontend checks passed.

### User Profile Management — real release complete
- Real dgt migration/backup complete; self-profile edits, password controls, login history and revocable sessions released. Verified11 logins plus real browser controls. Existing credentials preserved.
- Real page: localhost5175. Development remains localhost5173 with Store1/2 in dgt_test.
- MFA remains deferred; earlier test-only/real-release-pending notes for this page are superseded.

### Subscriptions & Billing — test version ready
- Store1 Basic60 and Store2 Modern90; scoped admin-only plan changes, full upgrade difference, no-credit downgrade, period-end cancellation, monthly renewal and due invoices implemented.
-20 backend integration tests plus frontend/browser checks passed. Real release not applied.
- Pending: user review; payment collection/methods, add-ons, tax rules, downloadable invoices, feature entitlements, reactivation and production release/operations.


### Subscriptions & Billing — local real release complete (2026-09-11)
- Supersedes the real-release-pending note above: schema and three plan prices now applied to real dgt; page available at http://localhost:5175.
- Each real store has Choose Plan; no test invoices/subscriptions copied. Choosing a plan creates a DUE invoice; payment collection remains deferred.
- Real admin scope and browser plan preview verified; 20 backend tests and frontend build passed.
- Pending: payments/methods, add-ons, tax rules, invoice downloads, plan feature entitlements, reactivation/cancel reversal, hosted operations. Exact schema changes and backup recorded in CHANGE_LOG.md.


### Add-ons — test billing ready
- On localhost:5173: Extra User $10, Payroll $30, Advanced Reports $20 monthly. Connected add/cancel, DUE invoices, monthly renewals and next-renewal totals.
- 21 backend tests, TypeScript/build and browser confirmation checks passed. Real dgt/5175 unchanged.
- Pending: review/real release, seat limits and quantities, payroll/report feature implementation, payment collection, price-editor UI. See CHANGE_LOG.md for exact DB tables/columns.


### Add-ons — local real release complete
- Supersedes test-only release status: add-on schema/catalog and billing code now released to real dgt and localhost:5175; access/API/browser checks passed.
- Real add-on billing supports add, period-end cancellation, DUE invoices and renewal. No payment collected.
- Pending: actual seat limits/quantities, payroll/report features, payments and price editor. Details/backup in CHANGE_LOG.md.


### Workweek — Employees test version ready
- localhost:5173 -> Workweek -> Employees. Add using existing active store user, or create a new CASHIER account. Save hire date/type, pay type/rate and store employment status; view/edit/search supported.
- 22 backend integration tests, frontend build/TypeScript and browser form checks passed. Existing tables used; no schema migration or real dgt changes.
- Pending: review/real release; manager/cashier/accountant permissions and approvals, multi-store employee handling, department/job title, payroll-specific fields, documents, overtime rules. Week Schedule, Time & Attendance, Time Off Requests/Approvals are next pages and remain unconnected.

- Employees test samples populated: Store1 and Store2 each display their cashier and the shared manager. Sample rates/hire dates recorded in CHANGE_LOG.md. Shared manager editing remains pending; real dgt unchanged.

- Shared manager editing now available in test: employee-wide pay/hire/type with store-local status; 23 tests and browser edit checks passed. Cross-company assignments blocked; new multi-store assignment UI and real release still pending.

- Test employee lists now include both company admins: four employees per store (two admins, manager, cashier). Sample admin rate $30/hour; real DB unchanged.

- Employee name/login-email edits now connected in test, with session revocation on email change. 24 tests pass. Job title/department assignment fields still require schema work; real release pending.

- Employee job title/store department, test deposit instructions and health/retirement deduction configurations are connected in dgt_test. 25 integration tests and frontend/browser checks passed. Real release pending; payments/payroll calculation and production deposit storage remain unimplemented. Exact schema changes in CHANGE_LOG.md.


### Employees — local real release complete
- Released schema and tested employee UI/API to real dgt / localhost:5175. No sample employee/pay/bank records copied; real onboarding remains pending.
- Real access and browser form checks passed; 25 backend tests previously passed. Deposit fields remain explicitly test-only instructions; payments/tax/payroll calculations and other Workweek pages remain pending.
- Exact schema, backup and limitations recorded in CHANGE_LOG.md. Development remains localhost:5173 -> dgt_test.

- Real Store1/Store2 employee sample setup now populated with explicit approval: four employees per store, five distinct people. Sample hourly rates/hire date documented in CHANGE_LOG.md; deposit/deduction details remain blank.

- Employee-first onboarding ready in test: Workweek creates employees without login; Roles & Access lists employees and grants email/password/website-role access. Existing accounts preserved; 26 backend tests and browser/build checks pass. Optional-login schema and real release pending review.

- Employee access test UI corrected: # / Employee Name / Job Type / Add User. Dialog asks Employee ID/email/password/website role and reuses saved names. Optional login preserved; real release still pending.

- Latest test correction: Job Roles displays store job title; Add User uses read-only employee-table ID plus email/password/role. Existing accounts show User Added. Real release remains pending.

- Employee-first website access workflow and latest Add/Edit User styling released to real dgt/5175; optional-login migration applied, existing links preserved, API/browser checks passed.

### 2026-09-11 — Workweek schedule/time off test implementation
- Ready in `dgt_test` / localhost:5173: Week Schedule (draft/edit/publish/cancel/copy), recurring availability, date exceptions, time-off submission/review, coverage volunteers and shift swaps with acceptance/decline and approval.
- Uses current store employees, including employees without website accounts via manager/admin submissions. Local timezone/DST and overnight shifts supported. Cross-store overlaps prevented. Scheduled leave days include weekends; no schedule means Awaiting schedule, not an invented total.
- Verification: 26 existing access tests + 7 workforce integration tests passed; TypeScript/frontend build and schedule/availability/swap/time-off browser checks passed.
- Real `dgt` / UI5175 release pending user review. Exact added columns/tables and test backup are recorded in CHANGE_LOG.md.
- Still pending: attendance/timeclock, paid-leave balances/accrual/payroll and breaks, partial-shift hourly leave, reversal of approved leave, automatic schedule generation and notifications. Availability entered one weekday at a time; latest 1,000 requests shown. These are not claimed as completed by this release.

- Workweek test UI restored to the original visual layout: compact schedule grid/summary cards/right-side editor and original time-off tables/status badges/approval tabs. API functionality retained. OT field remains blank; Undo disabled until implemented. Frontend-only; no database or real release changes.
- Add Shift test UI corrected: explicit missing-employee validation, future default date/time, employee job-title fill and navigation to saved shift's week. Actual browser save/reopen/cancel verified in dgt_test; real release unchanged.
- Availability/swap issue checked: both test tabs render; actual availability submit/cancel and full swap submit/recipient-accept/admin-approve verified. Added empty-state prerequisites and explicit form validation; corrected swap/time-off eligible-shift filtering. Temporary swap shifts cancelled; no real release.
- Weekly Availability removed from creation UI; Unavailability Date now submits unavailable date ranges only. Legacy weekly database records retained. Swap dialog supports changing week directly, future-shift filtering and specific empty-list guidance. Updated unavailability submission and swap week-selection/full decision flow verified in test; temporary shifts cancelled. Real release pending.
- Workforce approval policy updated: admin-submitted requests for admin employees auto-approve (swaps wait for recipient acceptance); all other employee requests retain explicit approval. Company-admin Approve works even on requests they submitted for staff. Existing pending rows remain pending until reviewed. No schema migration or real release.
- Coverage/swaps paused at user request (UI disabled and backend feature flag off). Existing data retained; pending cancellation remains allowed. Time Off Request Actions limited to status/eligible pending cancellation; approvals remain on Time Off Approvals. No real release/schema change.

### Workweek workforce — real release complete
- Real dgt migration applied with backup; backend8182 and frontend5175 updated. Schedule, Unavailability Date and time-off request/approval UI now connected to real stores/employees.
- Coverage/swaps remain disabled; weekly availability creation removed. Time Off Request Actions show status and eligible pending cancellation only. Approvals use latest admin/manager rules.
- API company-isolation/pause checks passed; exact columns/tables, backup and deployment snapshot recorded in CHANGE_LOG.md. Test records not copied.
- Remaining: coverage/swaps re-enablement when requested, attendance/timeclock, paid leave/payroll/breaks, approved-leave reversal, automatic rosters and notifications.
- Live schedule styling: each employee has a stable distinct shift-card color, matching the requested pastel style. Production UI5175 updated; no DB changes.

### Next module — Price Book
- Time & Attendance deferred until POS is implemented, per user instruction.
- Inspected Price Book source/UI dependencies. Currently an admin-only disabled preview, with sample/browser-local/Supabase data; not connected to Java/dgt workflows.
- Start with Items while retaining original UI, then proceed page by page. Field mappings, gaps and decisions are in PRICE_BOOK_INSPECTION.md.
- 2026-09-12: approved store-isolation migration applied to dgt_test and column/constraint definitions verified. SKU/barcodes are unique per store; cross-store ownership links are constrained. Real dgt unchanged.
- Pending: update Java write paths for required dgt_id fields, connect Items UI/API, and test item creation/editing and store isolation end to end. Database migration alone does not complete the page.
- Items UI/API implementation prepared, not running yet. Basic API persistence/store-isolation checks passed. Test modules row PRICE_BOOK added; permission-code whitelist extension was declined and remains unapplied. Cashier/admin approval test blocked by that whitelist; browser validation and test-server restart pending. Do not mark Items complete or release to real dgt.
- Price Book access correction completed in test: single manager PRICE_BOOK_ACCESS; company admins full access; cashier/accountant denied. Permission whitelist migration approved/applied, 37 integration tests passed, browser drawer checked and test backend8181 restarted. This supersedes the preceding permission blocker. Production release and deferred Items fields/workflows remain pending.

### Vendor Management — review complete, implementation pending
- Review: docs/VENDOR_MANAGEMENT_REVIEW.md. Vendor Type disabled/blank in Add Vendor source. Read-only schema inspection completed; no schema changes.
- Required: store-scoped vendor persistence/profile and both manual/invoice item linking through product_vendors. Current page remains browser-local/sample-based and gated as preview. Contact field mapping, link cost, invoice-posting timing and cost-history calculations remain to settle before implementation.
- Vendor Management core connected in test (2026-09-12): Add/Edit/List/Profile and manual same-store Link Item working; Vendor Type disabled. No new columns. 37 integration tests passed; test backend restarted and browser Add Vendor checked.
- User correction: Vendor optional for Add Item; invoice auto-link only for detected new products. Backend approved-invoice new-only linking endpoint verified; legacy invoice-screen/posting integration still pending.
- Remaining: Contact Name/address schema mapping, invoice/payment screens and totals, vendor cost history, case defaults/MOQ, contracts/pricing/audit UI, activation editor and production release. Full Add Item cost fields still deferred.
- Vendor representative name and Add Contract completed in test: Vendor Type removed; contracts support 12 requested types, Contract Type column, Save/Cancel and View. Two columns and ownership/type constraints applied to dgt_test (see CHANGE_LOG.md); 37 tests passed. Test backend restarted, real environment unchanged.
- Still pending for contracts: edit/termination, renewal automation, documents, rebate linkage and execution of pricing/discount rules. Contract creation stores terms only.
- Add Contract simplified: Contract Number and Volume Threshold removed from the form; database values retained. Volume Discount remains editable in Add mode; select Percentage or Amount for a supplied discount.
- Contract Edit now implemented in test with Save/Cancel and version checks. Return policy description stored/displayed; Active/Pending/Expired badges colored. Rebate/document inputs disabled; View reserved for document support and disabled for now. Refund processing, document upload/viewing and rebate integration remain pending. See CHANGE_LOG.md for the return_policy column migration.
- Vendor Pricing preferences and Audit Log connected in test: store-scoped Edit/Save/Cancel, cost-history reads, audit reads and displayed-record CSV export. No new columns. All 37 backend tests, TypeScript and frontend build passed; test backend restarted.
- Still pending: actual price-change notifications, threshold-based approval execution, Order Guide preferred/fallback selection, and cost-mutation workflow/history generation. Saving preferences does not yet enable these automations. Production unchanged.

### Vendor Pricing — current pending rules and cost-history requirements

Confirmed by user; recording requirements only, not implemented:

- Price Change Alerts: threshold preference saves; notifications still need implementation.
- Approval Required: threshold preference saves; cost-change approval enforcement still pending.
- Auto-pick in Order Guide: preference saves; preferred-vendor selection pending.
- Use Fallback Vendor: preference saves; availability definition and alternate-vendor priority pending.
- Consider Lead Time: preference saves; delivery-time versus price selection rules pending.

Cost Change History must capture two sources:

1. Manual cost changes by an admin or manager. Record previous cost, new cost, difference, percentage change, item, vendor, store, actor and timestamp/source.
2. Invoice cost changes: compare the present invoice item's cost with its previous invoiced cost for the same store/item/vendor. Example: Coke Regular 20 changes from $1.49 last week to $1.79 now; record +$0.30 (+20.13%) with both invoice references and invoice dates.

Implementation requirements to preserve correct comparisons:

- Compare equivalent units (item versus case and case-pack size); do not compare a case price directly to an individual-item price.
- Compare invoice cost against prior invoice cost, not a subsequently manually edited catalog cost.
- Record both increases and decreases; no cost-change entry for equal costs. Handle a missing prior invoice as an initial baseline, and a zero prior cost without dividing by zero.
- Keep manual and invoice sources distinguishable and repeated invoice processing idempotent.
- Invoice cost-history detection applies to existing products too. This is separate from the user's new-items-only rule for automatically creating vendor-item links; detecting a cost change must not create such a link for an existing item.
- Still to settle during implementation: gross versus net-after-discount cost basis, approved/posted invoice timing, backdated/corrected invoice handling, and whether invoice differences update current catalog/vendor cost or only create history.

Current state: history reads existing records; neither automatic source capture is connected. No database or runtime changes for this requirement note.

### Cost history implementation update — 2026-09-12 (test only)
- Manual capture implemented: Pricing → Edit Cost selects a linked item/vendor, shows current cost/unit, and saves a version-checked admin/manager change with history and audit entry.
- Invoice capture implemented for approved GROCERY invoices in the Java database, checked automatically when Pricing loads. Compares gross unit_cost against previous invoice cost for the same store/vendor/product/unit/case size, ordered by invoice date then ID. No catalog-cost update or automatic vendor link is performed.
- Equal costs and initial baselines create no change entry; decreases recorded; zero baseline has no percentage. Repeated scans are serialized per store and do not duplicate a recorded invoice-line change. Conflicting costs within one invoice are skipped as ambiguous; missing case pack is skipped.
- Pending: legacy invoice UI migration/posting hook (its sample/Supabase data is not imported), reconciliation of already-recorded corrected/backdated invoices, net-after-discount comparisons if requested, and review workflow for ambiguous invoice lines. Existing recorded history is not rewritten by rescanning.
- Still pending: actual alert delivery, cost-threshold approval enforcement, Order Guide auto-pick, fallback availability/ranking, lead-time versus price rules, and production release.

### 2026-09-12 — Production release status
- Connected Price Book Items and Vendor Management (vendors/contracts/pricing/audit/cost history) released to real dgt/backend8182/UI5175, including required ownership and contract columns. Exact migration/backup details in CHANGE_LOG.md.
- Production browser Pricing/Edit Cost check passed; user will perform populated cost/invoice testing later. No sample vendor/product/invoice records created for release.
- Auto-pick, Fallback and Consider Lead Time remain deferred. Cost-history invoice detection currently checks approved Java-database invoices when Pricing opens; legacy invoice UI integration and corrections/backdated reconciliation remain pending.

### Add Item — 2026-09-12 test completion
- Price Group/Promotional Batch removed from drawer. Remaining cost/unit/net/margin, stock count/reorder and age fields connected in test, with six approved catalog columns and stock movement tracking.
- Save/reopen and calculations verified in 38-test backend suite; browser drawer check passed. Vendor not mandatory.
- Next: user test on 5173, then separately authorized production schema/code release. POS checkout enforcement, inventory valuation/receipt costing and automatic reorder execution are separate workflows. Vendor quote history continues through Vendor Pricing; catalog defaults do not overwrite invoice/vendor records.

### Vendor View Items — 2026-09-12
- Completed in test: Sub-Department, saved/fallback Case Pack, inherited vendor Lead Time, MOQ per selected purchase unit, Edit, and Delete vendor link with product/history preserved.
- 39 backend tests and frontend build/typecheck passed; existing-item browser check passed. User testing and production release pending. Required test-only columns documented in CHANGE_LOG.md.
- Last Cost and Avg Cost remain pending calculation definitions; no placeholder values added.
- 2026-09-12 correction: Items catalog-cost changes now appear in Pricing Cost Change History alongside vendor/invoice changes. Existing audit storage reused; prior empty cost events are not backfilled. 40 backend tests passed; test runtime updated, production release pending.

### 2026-09-12 — Items/Vendor release completed
- Latest test-verified Items and Vendor Management fixes are now live against dgt on UI5175/backend8182. Both required migrations applied after backup; exact columns/artifacts in CHANGE_LOG.md. Production browser checks passed.
- Next page: Promotions. Existing deferred automation, POS enforcement and invoice-posting integration remain tracked separately.

### Promotions — inspection completed 2026-09-12
- Review: docs/PROMOTIONS_REVIEW.md. Next: confirm Buy/Get eligibility, bundle quantities and deletion policy; prepare store-scoped implementation and required test migration while preserving UI.
- Current page remains sample/localStorage based; not database connected. POS promotion execution remains separate.

### Promotions — test implementation completed 2026-09-12
- Connected Create/View/Edit/Deactivate, same-store real product selection, percentage/fixed/mix-and-match/bundle rules. Bundles support default1 or custom per-product quantities. Store-local dates/status and existing manager approval policy supported.
- Approved schema additions and verification recorded in CHANGE_LOG.md. 41 backend tests passed; browser bundle/mix form checked. Test only; production release awaits user review.
- Still pending with POS: selection of the free item when mix-and-match prices differ, discount overlap/stacking and limits, tax/returns and receipt integration. Automatic checkout application is not implemented.

### Promotions — production release completed 2026-09-12
- Promotions management is live on UI5175/backend8182 against real dgt. Required columns/constraints applied after backup; exact migration details recorded in CHANGE_LOG.md.
- Production build and browser form checks passed; 41 backend tests passed before release. No test promotions copied or created during release verification.
- Remaining: user testing with store products and POS promotion execution (free-item choice, stacking/limits, taxes/returns and receipts).

### 2026-09-12 — Price Groups inspection
- Price Groups inspection complete. Pending: confirm membership and unlink/deactivation pricing rules, then connect store-scoped management and actual item selling-price updates while preserving UI. See docs/PRICE_GROUPS_REVIEW.md.

### Price Groups — test implementation complete 2026-09-12
- Create/View/Edit/Deactivate and item linking/removal connected. One active group per item; group price updates actual selling prices. Unlink/deactivate keeps last price and preserves deactivated group history.
- Test schema changes and verification recorded in CHANGE_LOG.md; 42 scoped/workforce tests, TypeScript/build and browser form checks passed.
- Ready for user review on5173. Production release and future POS integration pending.

### 2026-09-12 — Price Groups live; Current Stock inspected
- Price Groups released to real dgt/UI5175/backend8182 after backup and production browser verification. Exact table/column changes in CHANGE_LOG.md.
- Both current-stock menu entries share the same sample component. Next: one store-scoped data connection preserving UI. Costing methods, historical snapshots, expiry/slow-sales rules and valuation access policy need definition; unsupported fields remain blank. Review: docs/CURRENT_STOCK_REVIEW.md.

### Current Stock — connected in test 2026-09-12
- Both menu entries now share real store items/counts, department/vendor filtering and recorded movement drawer. Existing Price Book admin/manager access reused for both.
- Remaining: approved invoice purchase history/posting, weighted-average versus last-purchase costing, historical balances, expiry/age and POS slow-sales rules. Unsupported fields blank/controls disabled. No database changes required for this read-only stage.
- 43 scoped/workforce tests and frontend checks passed; user review on5173 and production release pending.

### Current Stock value — implemented in test
- Current-cost value approved and connected: recorded quantity × current per-item net catalog cost. Table and filtered totals populated; missing-input rows excluded with a visible count. Case conversion and money rounding verified.
- Average purchase costing, historical stock, purchase history and risk calculations remain pending. Production release still pending.

### 2026-09-12 — Current Stock live; Bulk Update next
- Shared current-stock pages and approved current-cost inventory values released to real dgt/UI5175/backend8182 without schema changes.
- Bulk Update inspection complete: pending real store data, atomic validated save, cost/history/inventory integration and selected-row behavior. CSV and relationship editing require separate implementation; see BULK_UPDATE_REVIEW.md.

- Bulk Update correction: Export CSV replaces Import; connect the same Items data/save rules with table-based editing. CSV import is not requested. Export implementation remains pending real-data connection.

### Bulk Update — test implementation complete 2026-09-12
- Same Items API/tables, extra mapped columns, consistent derived cost fields, atomic changed-row save with approval/history/stock rules, and Export CSV connected.
- 44 scoped/workforce tests and frontend/browser checks passed. Test on5173; production unchanged.
- Vendor/price-group relationships remain managed on their own pages; promotional batch blank/disabled. No CSV import requested. User review and release pending.

### Bulk Update — all fields editable in test
- Every displayed field now has an edit control, including identity, all cost values, margin, vendors/groups and existing promotions. Cost edits preserve consistent underlying amounts.
- User-confirmed grouped pricing: individual edits are saved separately; the group price stays effective until unlink/deactivation, when the latest individual price applies. One test-only column added; exact migration in CHANGE_LOG.md.
- Existing promotion assignment is connected; new links default to quantity1, existing bundle quantities preserved. POS execution remains deferred.
- Production release requires the individual_retail_price migration; production unchanged pending review.

### Pricing correction — existing columns only
- Latest design supersedes separate individual-price storage: regular retail remains product_store_prices.retail_price; active price-group membership selects price_groups.group_price at read time. No group operation overwrites/restores regular retail.
- Extra test column removed after backup/preservation check. Do NOT apply the superseded individual_retail_price migration in production.
- 45 backend tests and frontend checks passed; test preview updated. Production release pending, including review of any historically overwritten regular prices.

### 2026-09-12 — Bulk Update/pricing live; New Arrivals next
- Approved Bulk Update and existing-column group-price resolution released on5175/8182 against dgt; no schema migration required. Supersedes earlier pending release and extra-column instructions.
- New Arrivals inspected: legacy Supabase reads, static catalog/departments and browser-only assignments remain. Next connect store-scoped invoice arrivals and persist classification/pricing using real backend rules, preserving the current UI.

### New Arrivals — test connection
- Approved invoice new-item list and existing Items category/regular-price saves connected; original UI retained. Test review pending.
- Pending: end-to-end invoice ingestion/approval workflow, defining legacy arrival statuses if needed, configurable subdepartment default margins, populated browser confirmation review and production release. No new tables/columns required for current connection.

### New Arrivals — invoice MSRP rule
- User retained approved-invoice flow; no separate Pending/Approved/Rejected arrival workflow requested now.
- Requested invoice MSRP as interim selling price until admin/manager assigns category and margin.
- Verified dialog uses real department choices, dependent subdepartment choices, manually entered margin and calculated regular price, persisted through Items update. Automatic Grocery Settings margin defaults are not connected (no database margin column).
- Test schema has no invoice MSRP column. new_arrivals.suggested_retail_price exists but is not established as invoice MSRP. Prepared proposals/20260912_invoice_msrp.sql (nullable nonnegative per-unit MSRP); not applied. Await database change approval before implementing invoice capture and temporary selling-price selection. Production unchanged.

### Invoice MSRP — test implementation verified
- Approved msrp column added in test; temporary selling-price resolution and confirmed-price replacement implemented and tested. Supersedes earlier pending schema approval.
- Pending: invoice-entry/import UI capture of MSRP as the invoice workflow is connected, populated user review, production release, and future POS pricing execution. No production change in this step.

### Manual invoice entry — connected in test
- Grocery Edit & view invoices manual entry captures MSRP and saves to existing dgt tables through scoped API. Explicit approval updates stock once and makes new items visible to New Arrivals.
- Pending: PDF/image import, invoice editing/rejection, notes, payment/tax/charge/PO matching workflows, comprehensive invoice costing reconciliation, user review and production release. Existing unused AddDeliveryDialog/postDelivery still legacy; not connected or enabled by this change.

### New Arrivals / manual invoices — live; Inventory Adjustment next
- Released to real dgt, backend8182/UI5175 with approved msrp column. Live page/form checks passed. Earlier production-release-pending notes superseded.
- Remaining invoice extras unchanged: auto-fill import, edit/reject, notes, payment/tax/charges, PO matching and broader costing reconciliation.
- Grocery Inventory Adjustment review complete: sample data, browser-only edits/approvals need store-scoped backend connection. Rules for returnable reductions, approval roles and transfers need confirmation.

### Inventory Adjustment — test workflow connected
- Real item list → reason/quantity request → Approvals → matching approved-history tab. Reuses existing reduction request table, no schema changes.
- Pending: user testing and production release; further vendor return/refund processing, destination transfer receiving/product mapping, dedicated shrinkage/return/transfer document posting, expiry and rebate rules. Current approved tabs are views of approved requests. Configure Grocery view/reduce permissions for employee roles and adjust permission for managers before employee testing.

### 2026-09-12 — Adjustment movement posting (test)
- Inventory Adjustment keeps all submitted requests and decisions in existing inventory_reduction_requests. Approval now inserts inventory_movements (ADJUSTMENT, negative qty_changed, unit_cost, reference_id pointing to reduction_request_id) first, then updates inventory.available_quantity using that stored movement's delta.
- Movement, balance and approval status commit atomically. Rejection does not post; insufficient stock rolls back the movement and leaves the request pending; repeat decisions cannot post twice. Existing balance is preserved rather than rebuilt from incomplete historical movements.
- No schema changes, product changes or production changes. Scope is this adjustment approval endpoint; invoice/POS/return processing is not migrated by this change.
- Validation: 37 scoped integration tests passed, including one movement per approval and no movement for rejected/failed approvals.

### 2026-09-12 — Inventory Approvals tab completion (test)
- Preserved existing summary cards, filters, request table and confirmation dialog. Approve/Reject use the scoped reduction decision endpoint; eligible reviewers see actions. Other pending rows explicitly say Awaiting authorized reviewer (including self-submitted requests).
- Added loading/error/retry states, readable reason labels, saved decision notes in history, 255-character note limit and guarded dialog dismissal during submission. Decisions refresh reductions, Items, current stock and movement queries.
- Frontend build/typecheck passed. Test browser verified the Approvals tab with two existing pending requests. Backend approval/rejection/movement behavior covered by the 37 passing scoped tests from the preceding change. No new database/schema changes or production release.

### 2026-09-12 — Admin adjustment auto-approval (test)
- Company-admin submissions now automatically approve in the same transaction, inserting the movement and updating the balance. Existing admin-owned pending requests can be approved by that admin. Other employees retain the approval requirement and cannot approve their own requests.
- Submission toast distinguishes immediate approval from pending review and refreshes inventory-related queries. No schema changes or production changes.
- All 37 scoped tests passed, including admin auto-approval, one movement, balance update and repeat-approval rejection. Frontend build passed; test backend restarted.

### 2026-09-12 — Inventory return/loss/transfer follow-ups (test)
- Applied approved proposal Backend/db/proposals/20260912_inventory_followup.sql to dgt_test after backup Backend/backups/dgt_test_before_inventory_followup.dump. Added inventory_returns.reduction_request_id, handed_over_date, settled_at, settled_by; inventory_transfers.reduction_request_id; inventory_transfer_items.destination_product_id; inventory_shrinkage.reduction_request_id. Added foreign keys and unique reduction links. Production untouched.
- New non-returnable/shrinkage approvals insert inventory_shrinkage and inventory_shrinkage_items with quantity, approval-time unit cost and loss_amount. Stock is reduced only by the original approval movement. The approved tab shows recorded loss.
- Returnable tab records vendor/full-quantity handover/date in inventory_returns and inventory_return_items, then tracks Pending, Refund received, Vendor credit received or Replacement received. Replacement posts RETURN_REPLACEMENT movement and credits inventory from that movement once. Refund/credit records acknowledge settlement only; no payment/accounting integration or quantity change.
- New transfer approvals create inventory_transfers IN_TRANSIT and inventory_transfer_items. Destination managers with Adjust stock permission or company admins select a matching destination-store product and confirm cumulative qty_received. Only the positive difference posts TRANSFER_IN and updates stock. Partial status retains unresolved quantity; full receipt completes. Destination item cannot change after first receipt; duplicate/over receipts rejected.
- Existing approved records are not silently backfilled into loss/transfer documents. Existing approved returnable requests can record handover. Full returned quantity is used for settlement; partial return settlements and shortage write-offs remain pending. Destination product must already exist; no automatic cross-store product creation.
- Preserved tab/card/table layout; added handover/settlement/receive dialogs. Expired & Expiring remains deferred.
- 38 integration tests passed: all settlement types, duplicate protection, unauthorized actions, recorded loss, destination isolation and 8-then-10 partial receiving. Frontend typecheck/build passed; updated test backend started. Test browser checked returnable tab.

### 2026-09-12 — Restore previous inventory adjustment version
- User rejected the new follow-up UI. Removed return handover/settlement and transfer receiving endpoints/UI and automatic follow-up document creation. Restored ApprovedReductions tables for returnable/non-returnable/transfers/shrinkage without the new loss column.
- Retained admin auto-approval, manager review, movement-first stock posting and approval history from the preceding version.
- Preserved the applied test database columns and any recorded follow-up data; no destructive schema rollback or stock reversal. The follow-up feature is deferred again. Production unchanged.
- 37 integration tests and frontend build passed; restored test backend restarted.

### 2026-09-12 — Restore original inventory tab layouts from screenshot
- Corrected prior rollback: it had restored the simplified ApprovedReductions replacement, not the user's original UI. InventoryManagementPage now renders the original ReturnableInventory, NonReturnableInventory, StoreToStoreTransfers and InventoryShrinkageWaste components again.
- Original filters, inventory columns, Return Details card, action buttons and history sections preserved. Scoped approved adjustments feed these components instead of localStorage/Supabase/sample history. Returnable vendor/department filters use actual store data.
- Deferred return creation/slip and receipt processing controls disabled; no new follow-up workflow or DB changes. Approval/movement backend unchanged. Sample return/reduction history removed from rendered state.
- Browser verified original Returnable heading, filters, inventory table, Return Details and action sections with actual approved record. Production unchanged.

### 2026-09-12 — Return slips and status tracking in original UI (test)
- Kept original Returnable layout. Create Return / Generate Return Slip save one selected approved adjustment as a return slip and open the existing slip preview. Existing slips reopen instead of duplicating. Print Slip uses print-specific styling; saved slips reopen via View Details.
- Reused inventory_returns (vendor_id, return_type for method, reference_number for RMA, status, reduction_request_id) and inventory_return_items (product_id, qty, approval movement unit_cost, reason). No new schema changes. Additional notes/attachment and sending to vendor remain unconnected; no external messages sent.
- Tracking loads saved database returns and allows authorized admin/managers to progress Draft → Pending → Sent → Credit Received → Closed; Pending can also go directly to Credit Received for credit without return. Changes audit through access_audit_events; credit date/reviewer stored in existing settled_at/settled_by. No stock mutation at slip/status stage.
- 38 integration tests passed, including persisted slip details, duplicate rejection, role checks, valid/invalid status changes and unchanged inventory. Frontend typecheck/build passed. Test backend restarted; original return UI browser checked. Production unchanged.

### Inventory Adjustment — pending, 2026-09-12
- Vendor replacement received: pending; no replacement receipt action or stock credit currently active.
- Handover date: pending UI/API connection; the database column exists but the restored screen does not populate it.
- Store-to-store receipt workflow: pending after rollback. Current original tab displays approved outgoing transfers only. Destination item selection, received/unresolved quantities and partial receipt stock movements are not active.

### 2026-09-12 — Recorded non-returnable loss and pending clarification
- Preserved original Non-returnable table, renamed Loss Value to Recorded Loss, and bound it to the approved adjustment movement quantity × movement unit_cost (rounded to cents). Later product cost edits do not rewrite recorded losses. Net Cost uses the same movement snapshot; missing values remain blank. Remaining stock shows the already-adjusted balance without subtracting the approved quantity twice.
- Added pending tracker entries for vendor replacement received, handover date and transfer receiving (removed in rollback). No schema changes or production changes.
- 39 integration tests passed including stable loss after item cost edit. Frontend typecheck/build passed; test backend restarted.

### 2026-09-12 — Transfer receiving restored within original UI; recorded loss
- Pending by user request: vendor replacement received workflow; vendor handover date entry. These remain deferred even though the earlier handover-date database column exists.
- Original StoreToStoreTransfers layout retained; added Sent quantity, Received and Unresolved columns. Destination-store authorized managers/admins use Receive items, choose an existing local product, and enter cumulative total received. No source-store receipt or cross-store item mapping allowed; partial receipts remain PARTIAL, full receipt COMPLETED; duplicate/over receipts rejected.
- Approval creates inventory_transfers / inventory_transfer_items for new transfers. Older approved transfer requests appear too; their transfer record is initialized transactionally on first receipt. Receipt creates TRANSFER_IN movement and derives destination balance delta from it. Original source adjustment is not posted again. Existing schema reused, no new migration.
- Non-returnable Recorded Loss is connected to the approved ADJUSTMENT movement's quantity × unit_cost (not current item cost). Existing layout preserved.
- 40 integration tests passed, including partial/duplicate/over receipt, destination isolation and recorded loss. Frontend typecheck/build passed. Test only; production unchanged.

### 2026-09-12 — Shrinkage & Waste table fields
- Kept the existing page layout and matched table columns to Date, Barcode, Item Name, Current Stock, Reduced Qty, Remaining Stock, Net Cost, Recorded Loss, Reason, Notes.
- Barcode uses primary-first product_barcodes lookup scoped by product/store; missing barcode/notes remain blank. Net Cost and Recorded Loss use the approved movement values. Stock columns display the current live post-approval balance (no historical before/after snapshot exists); no second subtraction.
- No schema or production changes. 40 integration tests passed; frontend typecheck/build passed. Updated test backend started.

### 2026-09-12 — Inventory release to real dgt / live 5175
- User approved release. Backup: Backend/backups/dgt_before_inventory_release.dump. Applied Backend/db/releases/20260912_inventory_adjustment.sql to dgt: inventory_returns.reduction_request_id, settled_at, settled_by; inventory_transfers.reduction_request_id; inventory_transfer_items.destination_product_id, foreign keys and unique reduction links. No business stock adjustments posted by deployment. Deferred handover/replacement columns/features not added in this release.
- Live backend /private/tmp/dgt-inventory-release/backend.jar on8182 and UI /private/tmp/dgt-inventory-live-ui on5175. Previous artifacts retained. Includes original inventory layouts, approvals/admin auto-approval, movement posting, return slips/status tracking, transfer receipts, recorded loss and Shrinkage & Waste columns. 40 tests passed before release; live build and startup passed.
- Next page inspection: EditViewInvoicesPage renders OrdersInvoices for both Edit and View tabs. StoreInvoiceEntryController supports list/detail/create/approve only; updating existing invoices is missing. PDF import, notes and other disabled controls require review before implementation. No invoice-page changes made in this release.

### 2026-09-12 — Pending invoice editing (test)
- Added Edit Invoice action for Pending invoices using the existing manual form with Save Changes / Cancel. Vendor, invoice number/date and invoice lines (quantity, purchase unit/case pack, cost, MSRP, add/remove items) can be saved before approval. Existing product catalog identity is not renamed by invoice edits.
- Added scoped PUT invoice-entry/{id} with required If-Match version, store/invoice locks, approved-state rejection and stale-edit rejection. Reuses entry validation; preserves is_product_new on retained lines. Edits are transactional, keep same invoice ID, audit INVOICE_EDITED and do not post inventory. Product records created by prior entry are retained if their line is removed.
- No schema changes. Approved invoices cannot be edited even via direct API. Existing approved posting behavior retained.
- 41 integration tests passed, including pending edit, stale edit, store isolation, retained new-item flag, no edit-time movement and approved lock. Frontend typecheck/build passed. Test backend updated; production unchanged.

### 2026-09-13 — Purchase Orders supplied design (test preview)
- Replaced Grocery Customized order guide navigation/component with Purchase Orders using the user's Downloads/PurchaseOrdersPage.tsx design and purchaseOrders.ts types. Original supplied files preserved in docs/design-inputs/purchase-orders/.
- Preserved Suggested Order Guide / PO History tabs, summary cards, expandable vendor/product rows, quantity inputs and dialogs. Legacy navigation name still opens the new page. Page remains an admin layout preview; local tabs/expansion work, persistence actions disabled.
- Supplied helper targets separate Supabase purchase_orders/purchase_order_lines schema, not DGT. Adapted app helper to an explicit unavailable persistence boundary; no Supabase or database reads/writes from this preview. Sample product data/formulas are for design review only; PO History empty. No new DB tables or production changes.
- Pending: inspect DGT purchase order schema, store-scoped persistence/permissions, real order suggestions/stock/vendor minimum/lead time, PO creation/status/receiving. Do not treat sample retail-derived daily sales or fixed minimum as approved business rules.
- Frontend typecheck/build passed; browser verified Purchase Orders navigation, vendor expansion and PO History tab.

### 2026-09-13 — Purchase Orders connection inspection
- Read-only check of actual dgt_test information_schema found no purchase-order/order-guide tables (only pos_terminals matched the search). Existing vendor/product/inventory tables will be reused for catalog and stock.
- Prepared Backend/db/proposals/20260913_purchase_orders.sql; awaiting schema approval. Two tables: store/vendor-scoped purchase_orders and linked purchase_order_lines, with draft status, timestamps, request deduplication key and ordered/received quantities.
- No schema changes or temporary records applied yet. Suggested quantities should use actual stock/reorder settings; supplied retail-derived sales estimates are design samples, not business rules.

### 2026-09-13 — Purchase Orders connected to test DGT
- Approved schema applied: purchase_orders and purchase_order_lines from Backend/db/proposals/20260913_purchase_orders.sql. Backup Backend/backups/dgt_test_before_purchase_orders.dump.
- StorePurchaseOrderController provides scoped catalog, list/details, draft creation, add draft lines, submit/cancel. Uses existing PRICE_BOOK admin/manager access; validates vendor/product belong to store and are linked, snapshots server-side item unit cost, quantities and names, deduplicates create requests and checks If-Match for edits/status. No PO action posts inventory or sends vendor messages.
- Supplied UI retained and connected to DGT, replacing preview/Supabase stubs. Suggested units use max(reorder level - stock, item MOQ), rounded to case pack when below reorder level. Retail-derived mock sales formula removed. Days Left, order-wide minimum and Next Order remain blank without appropriate data. Add Item remains available for vendors without suggestions.
- Temporary seed script Backend/db/proposals/20260913_purchase_order_samples.sql added TEMP PO Supplies vendor, two TEMP-PO items, stock via movements, vendor links, and one Draft/one Submitted PO per Store1 DGT-1017 and Store2 DGT-1018. Store2 needed TEMP PO Department/Subdepartment. Repeat script avoids duplicating samples. Existing items/stock not overwritten.
- Pending: approved-invoice/PO receiving linkage (Receive Items disabled); daily-sales forecasting, next-order schedule and vendor-wide minimum policy. No invented receipt status or stock posting. Production unchanged.
- 42 integration tests passed including create deduplication, draft edits, stale version rejection, store/role isolation and status restrictions. Frontend typecheck/build passed; test browser verified real catalog and temporary PO History. Test server updated on8181/UI5173.

### 2026-09-13 — Supplied invoice layout connected in test
- New Edit Invoice / Invoice Approvals / View Invoice layout applied from the five provided files. All three tabs read the same store-scoped test invoices; no sample invoice records in the components.
- Existing pending-only create/edit/approve flow retained, including case units, MSRP and approval-only stock posting. Dedicated read-only View Invoice restored. Browser edit/approval/idempotent-stock checks, TypeScript and build passed.
- Pending: PO-to-invoice linkage, separate invoiced/received quantities, rejection and decision notes, due dates/vendor terms, delivery metadata, charges/tax/rebates, notes, attachments/scanning and downloads. Related form controls remain disabled and no new columns were added.
- Release: test app only; production unchanged. Two clearly labelled TEMP-LAYOUT invoices retained in Store1 for review.

### 2026-09-13 — PO scope simplified; invoice linkage working in test
- Supersedes the earlier proposed PO receiving workflow: POs handle order creation, manager/admin approval and history only. Draft → Pending Approval → Approved; PO approval does not change stock.
- Create PO and Approve PO permissions are connected. Store1/Store2 test cashiers/managers can create; managers/admins can approve.
- Manual invoice vendor/PO selector is connected. Approved orders still awaiting receipt are shown by PO number; selecting one populates its items. Separate unit/case, ordered, invoiced, received, cost, tax, MSRP and totals persist; pending invoices remain editable.
- Invoice approval posts actual received units through inventory movements and balance, once. Invoice-based pending PO availability is derived without adding receiving controls to PO history. New Arrivals uses actual received quantity.
- Approved test migration applied and backed up; 43 integration tests, TypeScript/build and browser PO→invoice flow passed. Temporary linked Store1 invoice retained pending for review.
- Remaining invoice extras: independent delivery metadata, terms/due-date editing, additional charges/rebates, notes, attachments/scanning, rejection and downloads. Daily-sales forecasting remains deferred until POS; existing reorder-target suggestion stays in use.
- Release: dgt_test / localhost:5173 only. Production unchanged.


## 2026-09-13 — PO through View Invoice review

**Release:** Test DB and test application only; production release pending.

| Page | Connected | Still pending / deferred |
| --- | --- | --- |
| Suggested Order Guide | Store/vendor items, reorder-level suggestions, case rounding/MOQ, quantity edits, add/remove items and draft PO creation | POS sales forecasting/Days Left; vendor order minimum/schedule; previously deferred auto-pick, fallback and lead-time automation |
| PO History | Draft creation, adding draft items, submission, manager/admin approval, cancellation before approval, view and CSV download | No receiving workflow required here; receiving belongs to approved invoices |
| Edit Invoice | Pending-only editing, vendor/approved pending PO link, ordered/invoiced/received quantities, units/cases, tax/MSRP, delivery details, due date, payment terms, notes and additional charges | Attachments/OCR and rebate linkage |
| Invoice Approvals | Approval and idempotent received-stock posting through movements/balances | Rejection, decision notes, automated variance alerts |
| View Invoice | Saved header, lines, charges, notes and totals | Document attachments, download/export and actual payment tracking |

Invoice charges start unpaid; approval does not represent payment. Additional fees affect invoice totals, with no landed-cost allocation to item costs. Invoice edits remain blocked after approval. API integration validation: 44 tests passed; frontend/backend builds passed.


### 2026-09-13 — PO/invoice release status update

The PO through View Invoice implementation above is now released to real `dgt`, backend 8182 and live frontend 5175, with user authorization and backup. Production API/browser smoke checks passed. The listed deferred features remain pending; production release itself is complete. Existing production role preferences were preserved; admins can configure Create PO / Approve PO through Roles & Permissions.


## Grocery Settings — inspection and schema proposal (2026-09-13)

**Status:** Inspected; test schema proposal awaiting user approval. No runtime or database changes yet.

- Preserve current five-tab layout. Main settings currently use component state and toast-only saving; margin settings use browser-local storage/static departments; audit rows are samples and rollback is a toast.
- Verified existing test schema: `store_sub_departments.is_taxable`, `products.is_taxable`, `products.reorder_level`, vendor lead-time fields, `store_role_permissions` and `access_audit_events` can be reused. No existing store grocery settings or sub-department default margin field found.
- Prepared `Backend/db/proposals/20260913_grocery_settings.sql`: one 20-column per-store `grocery_settings` table and one nullable `store_sub_departments.default_margin_percentage` column. No new audit or permission tables proposed; no schema applied.
- Implementation scope after approval: scoped persistence, validation/version checks, existing store departments/margins, actual change history, connect defaults to applicable item/new-arrival flows. Preserve existing product prices until an explicit pricing action. POS tax behavior, expiry processing/notifications and sales-based forecasting remain deferred and must be identified as such in the UI. Do not claim saved preferences enable these engines.


### Grocery Settings — implemented in test (2026-09-13)

**Status:** Store-scoped settings persistence, margins and audit connected; production release pending.

- Working: Edit/Save/Cancel, separate Save Margins, validation/conflict handling, company-admin or explicitly permitted manager access, actual store departments, before/after audit history, saved tax default for Add Item/new invoice products, margin prefilling in New Arrivals. Saving defaults does not reprice existing products.
- Preferences saved, behavior deferred: sub-department/item tax override policies, tax rounding/payment exemptions, expiry monitoring/alerts/email/sale blocking, days-of-stock forecasting, lead-time/safety-stock/item-override automation. Existing item-based reorder suggestions remain active. UI distinguishes these from implemented behavior.
- Pending: audit rollback/automatic retention and production release. No extra audit/permission tables introduced.
- 45 integration tests and builds passed; test browser checked persistence/cancel/history and downstream defaults. Test Store1 review values: non-taxable, Beverages margin32.5%, temporary invoice184 / SKU TEMP-GSET-1789312236786. Test backup and exact changes recorded in CHANGE_LOG.md.


### 2026-09-13 — Grocery Settings production release / inventory page removal

Grocery Settings persistence, margins, audit and downstream defaults released to production dgt/8182/5175 with backup and user authorization. Deferred automation/rollback remains pending. Reduce Inventory (Non-returnable) page removed by user request; adjustment/loss data and backend workflows preserved. No test samples or saved test preferences copied to production.


## Gas module — initial inspection (2026-09-13)

**Status:** UI/layout preview; implementation has not started. No database or runtime changes during inspection.

- Ten navigation pages: Dashboard, Gas statistics, deliveries, invoices & payments, inventory adjustment, tank report, reports, gas price, settings, fuel expenses. Gas components are not passed selectedStoreId and contain no backend request/fetch/Supabase/localStorage connections found in this inspection. Index connectedPage excludes Gas: company admins see disabled layout preview, other users see the unconnected-permissions message.
- Dashboard/statistics/report tables contain sample values. Delivery Save Draft / Confirm Received buttons have no persistence handlers. Settings save displays a toast; tank edits stay in local component state. Price/payment/adjustment flows are not connected to store-scoped business APIs.
- Eight existing fuel tables can be reused: fuel_grades, fuel_tanks, fuel_pumps, fuel_tank_grade_assignments, fuel_tank_readings, fuel_prices, fuel_invoice_details, fuel_invoice_items. Generic CRUD controllers/services exist; these do not constitute a connected Gas workflow. Shared invoices/vendor/payment structures need field-by-field review before proposing additions.
- Recommended implementation sequence: store-scoped tank/grade/pump configuration and permissions; delivery/invoice receiving; tank readings/reconciliation/adjustments; price tracking and payments; data-backed dashboards/reports. POS-dependent sales and automated sensor readings must remain separate pending integrations. Preserve current UI and start with Store1/Store2 test DB.


### Gas Delivery — new supplied design applied (2026-09-13)

Test UI5173 matches supplied page/table and centered BOL dialog design. Admin can review local input/line interactions. Archived all four original files under docs/design-inputs/gas-delivery. Still pending: real store vendor/tank data, BOL parsing service, persistence/draft/receiving workflow, export and production release. No uploaded file transmitted and no DB changes. TypeScript/build and browser checks passed.


### Gas Settings layout update (2026-09-13)

Removed User Role Access, Expense Mapping and Delivery Rules sections as requested. Fuel-grade/tank configuration connection remains the next implementation task; current controls are still layout-only. Production unchanged.


Gas Settings layout follow-up (2026-09-13): Price Tracking Rules also removed from the settings page. Test UI only; production unchanged.


### Gas Settings — field mapping / schema proposal (2026-09-13)

User requested implementing the remaining cards: General Gas Configuration, Tank Configuration, Variance Rules, Alerts & Notifications, Audit & Locking. Inspected current test database; no gas settings table or existing matching tank setting columns. Prepared `Backend/db/proposals/20260913_gas_settings.sql` (29-column gas_settings, six additional fuel_tanks columns), not applied, awaiting user schema approval.

Reuse fuel_grades as existing catalog; persist each store's selections through fuel_tank_grade_assignments. Reuse tank name/number/capacity/safe-fill fields and existing audit events; no duplicate grade/tank/audit tables. Need store-scoped API, Edit/Save/Cancel, valid tank/grade references, capacity/history protection, actual audit export and removal of sample tank records. Keep remaining card layout. No pump card exists in current settings UI; do not add unsolicited page sections.

No store bank-account table found: sample bank dropdown must become blank/disabled until banking integration. General blending, tax/tolerance, payment/settlement, variance and notification settings can persist as preferences; actual blending/POS operation, payments, alerts and delivery-threshold approval require corresponding Gas workflows. Exact first-delivery tank locks require receiving-to-tank linkage, currently absent. Existing reading/assignment history can protect tank edits; do not imply delivery-specific enforcement is already available. No production changes.


### Gas Settings connected in test (2026-09-13)

Implemented the five remaining cards with store-scoped persistence and Edit / Save Settings / Cancel, preserving their layout. Removed cards remain absent. Fuel Grades supports adding catalog definitions; each store chooses its own tank assignments. Tank number/name, capacity, safe-fill, low-level percentage, per-gallon taxes/fees and POS mapping persist. Saved capacity and grade assignments are protected; safe-fill locks when readings exist. Existing assignment history is retained, stale edits rejected, and cross-store references blocked.

Company admins can manage settings; managers require GAS_SETTINGS permission. Cashiers/accountants cannot manage them. Field changes and grade creation use existing access audit events; CSV export returns the store's full Gas audit history. No sample bank accounts or invented tax rates remain.

Applied approved test-only schema: `Backend/db/proposals/20260913_gas_settings.sql` (one 29-column table and six fuel_tanks columns), plus `20260913_gas_settings_permission.sql` extending the existing permission whitelist. Backup: `Backend/backups/dgt_test_before_gas_settings.dump`. Existing fuel grade, tank, assignment and audit tables reused. Test backend8181 restarted with Gas Settings enabled; UI5173 connected. Production unchanged.

Validation: TypeScript and frontend build passed; all 46 ScopedAccessIntegrationTest cases passed. Browser verified grade creation, tank save, Cancel, persistence after re-login, capacity lock and audit export. Store 1 test fixture: TEMP Regular 87 / Gasoline / 87 octane; tank TEMP-01, Temporary test tank, capacity10000 and safe-fill9000 gallons. These are test configuration values, not stock readings. Store2 isolation tested with separate disposable fixtures.

Pending: actual blending/POS calculations, tax/report calculation consumption, supplier bank/payment integration, dashboard/email notification execution, variance approval automation and first-delivery-specific locking. Preferences save now; these downstream workflows are not active. Gas Delivery remains the supplied design preview awaiting its own API/receiving integration. Grade definitions are shared catalog entries; tank configuration and settings are store-specific.


### Gas Settings production release (2026-09-13)

User authorized production release. Backed up dgt to `Backend/backups/dgt_before_gas_settings_release.dump`, then applied `Backend/db/releases/20260913_gas_settings.sql` transactionally: gas_settings (29 columns), six fuel_tanks columns and GAS_SETTINGS permission whitelist extension. No temporary test grades, tanks or preferences copied.

Production backend8182 uses `/private/tmp/dgt-gas-settings-release/backend.jar`, with Gas Settings enabled and existing flags preserved (workforce shift changes remain disabled). UI5175 serves `/private/tmp/dgt-gas-settings-live-ui`, built for the production API and session login. Previous Grocery Settings artifacts retained. Production browser verified admin login, loading Gas Settings, Edit/Cancel and audit export. Pre-release 46 backend tests and frontend checks passed.

Next: connect Gas Delivery to real store vendors, tanks and grades, then draft/confirmation persistence and inventory movements. Supplied Gas Delivery design is included but its receiving/parser integration remains pending. Settings preference automation, bank/payment integration and first-delivery-specific locks remain pending as documented above.


### Gas Delivery connection review and schema proposal (2026-09-13)

Inspected the test DB and supplied BOL form. Existing fuel_invoice_details/items require an invoice and prices; they cannot store a standalone unpriced BOL draft. fuel_tank_readings represents measured levels, not receipt movements. No standalone delivery table exists.

Prepared `Backend/db/proposals/20260913_gas_deliveries.sql`, NOT applied: fuel_deliveries header and fuel_delivery_lines; extend existing inventory_movements with tank/grade/delivery-line/net-gallons references, retaining product movement requirements. Composite foreign keys enforce store ownership; unique vendor/BOL prevents duplicate deliveries, unique movement delivery-line prevents duplicate receipt posting. Draft does not post; Received records gross and net gallons, unknown cost stays null. No fabricated physical readings or grocery balance updates.

Next implementation: scoped API/permissions, existing-design supplier/tank selectors, draft reopening, transactional confirmation, real list/filters/export and audit. Reuse real vendor/grade/tank catalogs. BOL OCR, document storage, invoice reconciliation/cost and tank-level reconciliation remain separate pending tasks. Production untouched. Awaiting schema approval before application.


### Gas Delivery connected to test database (2026-09-13)

User authorized implementation: BOL deliveries have no cost or selling price. Cost deferred; fuel selling prices remain manually controlled. Preserved supplied dialog sections, filters and table layout. Removed Cost $ / $/Gal columns and sample deliveries/reconciliation alerts. Real supplier/tank/dated fuel-grade selectors, Save Draft, View/Edit Draft, Confirm Received, filtering and CSV export now work. Received BOLs are read-only; gross/net gallons and receipt actor/time persist. Central Gas Permissions separately grant view, record and receive operations; company admins retain full access.

Applied `Backend/db/proposals/20260913_gas_deliveries.sql` to dgt_test after authorization, backed up at `Backend/backups/dgt_test_before_gas_deliveries.dump`. Added fuel_deliveries (23 columns), fuel_delivery_lines (15 columns), and four inventory_movements columns: tank_id, fuel_grade_id, fuel_delivery_line_id, net_gallons. No separate movement ledger. Composite keys enforce store ownership; store/vendor/BOL uniqueness, create-request idempotency and unique receipt-line movement prevent duplicate posting. Product movement product_id/unit_cost requirements remain enforced by a conditional constraint. Test database now99tables; production remains97tables.

`fuel/delivery/GasDeliveryController.java` implements transactions, locks, stale-version checks, active same-store vendors, dated tank assignments, quantity precision/capacity validation and audit events. Drafts leave inventory unchanged. Confirmation posts gross qty_changed and separate net_gallons once per line; product_id and unknown unit_cost remain NULL for fuel. No grocery balances, synthetic tank readings, invoices, costs, taxes or fuel_prices are created/updated. Receipt movements alone do not establish a measured tank level or reconcile opening stock and sales.

Test backend8181 restarted with app.gas.delivery.enabled=true; UI5173 connected. All47 ScopedAccessIntegrationTest cases passed, including concurrent receipt deduplication, scope/permissions, stale drafts, invalid/future receipt rollback, multi-line posting, unpriced movements and unchanged manually stored fuel_prices. TypeScript/frontend build passed. Browser verified save/reopen/edit/receive, received read-only fields, persistence after sign-in, status filters and downloaded quantity-only CSV.

Retained Store1 test fixture TEMP-GAS-1789319919051: existing vendor cokacola, TEMP-01 / TEMP Regular87, 125 gross and124 net gallons. DB check confirmed exactly one FUEL_DELIVERY movement with no cost/product_id. Production5175/8182 unchanged; no test fixture copied.

Pending: BOL photo extraction and document storage (disabled), physical tank reconciliation/variance and first-delivery-specific settings enforcement, invoice linkage/cost reconciliation, and requested production release. Delivery receiving never recalculates or overwrites manual fuel selling prices.


### Gas Delivery production release (2026-09-13)

User authorized release. Backed up production to `Backend/backups/dgt_before_gas_delivery_release.dump`, applied `Backend/db/releases/20260913_gas_deliveries.sql` transactionally (two delivery tables, shared movement extensions and permission codes). Production now99tables. No test grades, tanks, deliveries or movements copied; no prices updated.

Released backend `/private/tmp/dgt-gas-delivery-release/backend.jar` on8182 and UI `/private/tmp/dgt-gas-delivery-live-ui` on5175. Enabled app.gas.delivery.enabled while retaining settings/other feature flags and disabled workforce shift changes. Previous Gas Settings artifacts retained. Production browser verified admin login, empty real delivery list, manual BOL form, Save Draft/Confirm Received controls and absence of price/cost columns. Did not create a production receipt. The complete write/receipt flow passed47 backend tests and browser checks in dgt_test before release.

Live stores need actual vendor and dated tank/grade configuration to record deliveries. Next suggested page: Gas Price, connecting manual selling-price updates/history; invoice costs remain deferred as requested. Photo extraction/storage and physical tank reconciliation remain pending.


### Gas Price manual selling-price workflow — test (2026-09-13)

Connected Gas → Gas price in UI5173 and test backend8181, preserving current-price cards, right-hand Record Price Change drawer, history table and export. Uses existing fuel_prices cash_price, credit_price, effective_from/effective_to and changed_by. No tables or columns added; test/production schema counts remain99tables. Existing access_audit_events stores manual-change reason, notes, before/after prices and retry identity. No delivery cost or selling-price automation introduced.

Company admins and active store managers granted GAS_SETTINGS may manage selling prices; reused permission label now reads Manage gas settings and selling prices. Cashiers/accountants and other companies denied. Active catalog grades can be chosen for a store's first price; stored prices remain store-specific. Current cards include that store's assigned/priced grades only, with distinct cash/credit amounts, real changer/time and daily change count. No POS Sync sample records, fake prices, costs, margins or alerts remain in the connected page. Margin Insight clearly indicates cost calculations are deferred.

Manual changes are immediate and positive, with up to3decimals. A changed price closes the previous record and inserts the next, preserving history. Same prices create no extra row. Store locks, version checks and idempotency prevent duplicate changes/lost updates. Overlapping or pre-existing scheduled prices require review rather than silently rewriting history. History/export retain actor, reason, notes, reference and both tender prices; legacy rows without a matching manual audit are labelled Recorded, not POS Sync. Drawer fetches fresh prices on every opening; Cancel discards edits. Each new opening has a fresh request identity, allowing intentional A→B→A changes.

Enabled app.gas.price.enabled in run-development.sh. All48 ScopedAccessIntegrationTest cases passed, covering permissions/store isolation, previous/new prices and timestamps, retry/no-op behavior, stale/concurrent updates, invalid/scheduled submissions, overlapping-record rejection and unchanged inventory movements. TypeScript/build passed. Browser verified three manual changes and restoration, cancel/reopen, disabled scheduling, current/history display and downloaded CSV. Test Store1 TEMP Regular87 now cash3.299/credit3.399, with three manual test records (PRICE-8/9/10); notes explicitly TEMP manual price browser check. Test data only; no production price changed.

Production5175/8182 remains the Gas Delivery release. Pending: explicit production release of Gas Price, POS sending, scheduled changes, cost/margin integration. Receiving deliveries does not touch fuel_prices. This page saves store selling prices in DGT; it does not change pump/POS prices until that integration is implemented.


### Scheduled Gas Price changes — production release (2026-09-13)

Implemented and released manual immediate/scheduled cash and credit selling prices to UI5175/backend8182. Reuses fuel_prices effective_from/effective_to and access_audit_events; no migration, new tables or columns. Both databases remain99tables. Schedule uses the store timezone, rejects nonexistent daylight-saving times and requires an occurrence choice for repeated times. One upcoming change per grade; immediate changes preserve that schedule. Cancel Schedule restores the current interval and retains cancelled history. Effective intervals activate the price even when the browser is closed; the page refreshes every5seconds. Store scope, admin/authorized-manager access, stale-write checks and retry protection remain enforced.

All49 ScopedAccessIntegrationTest cases and frontend build passed. Test browser verified future prices do not apply early, cancellation persists, and a scheduled price becomes current at its deadline. Store1 test price is now cash3.599/credit3.699; temporary data was not copied to production. Live browser verified the real Gas Price page and history; production currently needs fuel grades configured in Gas Settings. No production prices were created during verification.

Release artifacts: /private/tmp/dgt-gas-price-release/backend.jar and /private/tmp/dgt-gas-price-live-ui. Backup: Backend/backups/dgt_before_gas_price_release.dump. Existing feature flags retained, including disabled workforce shift changes. This supersedes the earlier scheduling/release pending entry. POS/pump sending and cost/margin integration remain deferred; delivery receipt does not alter selling prices.


### Gas Inventory Adjustment — gallons-only preparation (2026-09-13)

User requested the full page using gallons only. Removed weighted cost and dollar impact fields from the existing adjustment table, new drawer and detail drawer; adjustment column now shows gallons. TypeScript checked. Existing mock workflow is not yet connected or released.

Inspected dgt_test: inventory_reduction_requests requires a grocery product and positive reduction; invoice_adjustments stores invoice amounts; fuel_tank_readings stores measurements, not requests. None can represent tank correction drafts and approval history. Prepared Backend/db/proposals/20260913_gas_adjustments.sql, NOT applied: fuel_adjustments + fuel_adjustment_lines, shared inventory_movements adjustment reference/constraint and permission codes. No prices or costs; no separate movement ledger. Awaiting required schema approval. Proposed stock baseline uses an actual tank reading plus subsequent recorded gross-gallon movements; missing baseline must be shown as unavailable, never inferred as zero. POS sales remain unconnected. Approval must validate the baseline has not changed and post once; admin submissions auto-approve and authorized managers can approve staff submissions. Production untouched.


### Gas Inventory Adjustment connected — test (2026-09-13)

Applied the approved Backend/db/proposals/20260913_gas_adjustments.sql to dgt_test after backup Backend/backups/dgt_test_before_gas_adjustments.dump. Added fuel_adjustments (requests/review metadata), fuel_adjustment_lines (tank, grade, snapshot/actual/difference gallons and reason), and inventory_movements.fuel_adjustment_line_id with same-store composite foreign key and unique posting constraint. Extended the existing movement subject constraint for FUEL_ADJUSTMENT and added three gas adjustment permission codes without auto-granting roles. Test now101tables; production remains99. No price/cost columns added or changed.

Connected Gas → Inventory adjustment on test UI5173/backend8181 with app.gas.adjustments.enabled=true. Retained the page's header, filters, table and drawer structure; removed all costs/dollar fields, fake rows, hardcoded grades/gallons and fake success/alert behavior. Tank selection uses actual store configuration and grade assignments. System gallons use the latest measured tank reading plus subsequent recorded movements (gross gallons). Admin can record the initial measured tank reading, including zero; missing readings never default to zero. This initial reading anchors the tank and is not itself an adjustment. Sales remain unavailable until POS integration, clearly indicated on the page.

Implemented multi-tank drafts, reopening/editing drafts and pending records, submission, admin auto-approval, authorized-manager approval of another user's request, rejection with required reason, immutable completed records, real pending counts, history/details, date/grade/reason/status filters, and CSV export. Approved UI status corresponds to POSTED in the database: approval and movement insertion are one transaction. All values are gallons; no grocery inventory/product balances or fuel prices are touched. Each approved line posts exactly one movement; rejected/draft/pending requests post none. Existing access_audit_events retains creation/edit/submission/review history.

Store/tank locks, request idempotency, row versions and baseline checks prevent duplicate or stale posting. Current-date adjustments use the store timezone; old-date requests or changed readings/movements require reopening and reconfirming against current gallons. Actual zero is valid, unchanged readings need no adjustment, and negatives/excess-capacity/overprecision are rejected. Unauthorized roles and cross-store IDs are blocked.

Validation: all50 ScopedAccessIntegrationTest cases pass, including positive/negative/zero balances, draft/edit/approval/rejection, admin auto-posting, manager self-approval denial, malformed cashier approval grants, cross-store access, idempotency, stale-baseline approval and simultaneous approvals posting once. Backend package, TypeScript and frontend build pass. Browser verified initial reading1000gal, draft975gal, edit970gal, admin approval, persisted history/details and downloaded CSV. DB confirmed one -30gal movement with NULL unit_cost for test Store1 ADJ-4. No production changes or test data copies. Pending production release; POS sales integration remains deferred.


### Gas Tank Report connected — test (2026-09-13)

Connected Gas → Tank report on test UI5173/backend8181 using app.gas.tank-report.enabled=true. Preserved the report header, calendar range, grade selector, Run Report, sortable daily table and All Tanks Summary toggle. Replaced active-page sample data and hardcoded tolerance results with a read-only store-scoped API. Export downloads daily or summary CSV with the applied dates, store timezone, report timestamp and empty unavailable values. Added the approved-adjustment gallons column and tank identification so multiple tanks of one grade remain distinct. No database migration or writes required; test remains101tables and production99.

Uses existing fuel_tanks, dated fuel_tank_grade_assignments, fuel_tank_readings and inventory_movements. Opening is the last measured reading before the day's start plus subsequent recorded movements before start. Recorded closing uses the latest reading before the cutoff plus subsequent movements; a new measurement reanchors this balance. Deliveries and approved adjustments are summed by posting timestamp, not invoice/BOL load date. Store-local midnight boundaries handle daylight-saving changes; today stops at report generation time. Tanks do not appear before their creation date. Missing measurement baselines remain NULL, while known absence of posted movements is zero. Daily measured volume is the last reading taken that day, with its actual timestamp; it is not labelled a closing measurement. Summary carries first opening, last recorded closing, period deliveries/adjustments and latest period measurement.

Sales, stick inches, over/short, variance and tolerance results remain unavailable (dash/empty export), as agreed, until their input data is connected. No invented POS sales, inferred loss, prices, fake regulatory tolerance claims or active alerts. Existing unused prototype report components are not rendered by this connected page. Report access reuses gas adjustment read/create permissions; authorized managers with gas settings or adjustment approval can also read. Updated permission label to View gas adjustments and tank reports; no automatic permission grants.

Validation: all51 ScopedAccessIntegrationTest cases passed, including store isolation, permission denial, invalid date/grade ranges, DST daily boundaries, receipt posting date versus load date, gross rather than net gallons, approved adjustment inclusion, reading reanchoring/no double count, missing baseline handling and report reads leaving movements unchanged. Backend package, TypeScript and frontend build passed. Browser verified Run Report, saved -30gal adjustment, recorded closing970gal, All Tanks Summary and both downloaded CSV files. Store1 existing test data used; no new manual report fixtures retained and production unchanged. Pending production release; POS sales and complete physical reconciliation remain deferred.


### Gas Adjustments and Tank Report production release (2026-09-13)

User authorized push. Backed up dgt to Backend/backups/dgt_before_tank_report_release.dump and applied Backend/db/releases/20260913_gas_adjustments.sql transactionally: two fuel adjustment tables, one shared movement reference and validation/permission constraints. Production now101tables, matching test. No temporary test tanks, readings, deliveries, adjustments or prices copied.

Released /private/tmp/dgt-tank-report-release/backend.jar on8182 and /private/tmp/dgt-tank-report-live-ui on5175 with gas.adjustments and gas.tank-report enabled, retaining previous feature flags and disabled workforce shift changes. Previous Gas Price artifacts retained. Production browser verified Tank Report, Run Report, All Tanks Summary, empty adjustment history and New Adjustment setup guidance. No production readings or adjustments created. Full write/report behavior had passed51 integration tests and test browser checks before release. Live stores need real tank/grade setup and measured initial readings.

Next inspected Gas → Reports → Gas Sales. Current by-day/by-fuel/by-hour tables, summary/trend, tender detail and price strip still use sample data; date filters are not connected and history navigation is a console placeholder. Next task is connecting an actual sales source; POS integration is still deferred. No Sales implementation changes made in this release.


### Complete station sales import and Live Activity — test (2026-09-13)

Imported ProductsTable_ST001_values_only (1).xlsx into Store1 (DGT-1017) in dgt_test: 244 products, 980 completed sales, 1,904 sale lines and 980 payments, totaling $26,827.12. Preserved original May 1–August 6, 2026 sale dates in America/New_York; Excel fractional-day timestamps round to the nearest second. Source ST001 maps to Store1. Reused existing tables; no schema changes (101 tables). Backup: Backend/backups/dgt_test_before_sales_workbook.dump.

Import scripts are in Backend/scripts/imports. The existing access_audit_events records the workbook SHA256 and source-to-database ID mappings. Reimporting the same workbook is a no-op; conflicting identifiers abort rather than overwrite. Five explicitly labelled imported cashier employee records have no website accounts, and imported terminals are inactive. The workbook provides no opening stock: imported inventory has zero recorded quantity, and historical sales were not replayed against present stock or gas tanks. No fuel selling prices changed.

Connected Live Activity on test UI5173/backend8181 with app.sales.activity.enabled=true. Company admins and assigned store managers can read their store's transactions, receipt lines, actual tax/discount/payment amounts, tender totals, top items and department totals. Added real date/terminal/type filters, pagination, complete filtered CSV export, manual refresh and five-second automatic refresh. Latest sales date is the default so historical data is visible; Today does not pretend imported sales happened today. Removed fabricated connection counts and receipt tax calculations. POS connection is explicitly unavailable; no-sale, suspended-sale and line-void counts remain unavailable until a source supplies them. Daily Closing integration remains pending.

Validation: all 52 ScopedAccessIntegrationTest cases, backend package, TypeScript and frontend build passed. Browser verified 980 transactions/$26,827.12, receipt details, terminal filtering, empty Today results and full CSV export. Automatic refresh picked up a temporary $1 sale without manual refresh; that receipt/payment was deleted afterward and totals restored. Production UI5175/backend8182 and its database remain unchanged. Actual POS ingestion and inventory posting from future sales are not implemented by this read-only activity page.


### Live Counter reference design restored — test (2026-09-13)

Matched the supplied reference layout: Live Counter heading, header controls including Open Daily Closing navigation, five summary cards, eight compact receipt rows per page, tender/alerts/top-five-item sidebar and seven bottom summary cards. Retained real date filters, pagination, receipt details, export and refresh. Department breakdown is collapsible. Source sales remain unchanged; unavailable POS counters/grade mapping are shown as dashes and connection status remains accurate. No fabricated trends, alerts or connection status. TypeScript/build and browser checks passed, including receipt details, original dates, all-sales totals, terminal filters and export. Test UI5173 updated; production unchanged.


### Imported item sample stock — test (2026-09-13)

User authorized random available quantities for imported Store1 items. Backed up dgt_test to Backend/backups/dgt_test_before_sample_stock.dump and applied Backend/scripts/imports/seed_workbook_test_stock.sql. Added 244 ADJUSTMENT movements before applying their quantities to inventory.available_quantity: merchandise 12–240 in each item's recorded unit, fuel catalog products 1,000–8,000 gallons. These are explicitly audited sample counts, not physical measurements or gas tank balances. The script is test-only, scoped to the source workbook mapping, refuses existing stock/movements and skips repeated execution using SALES_WORKBOOK_SAMPLE_STOCK. No new schema, historical sale replay or production changes.

Verified all244 balances equal their recorded sample movements; historical980sales/$26,827.12 unchanged. Corrected Grocery Sales department matching to include the workbook's Dairy & Groceries alongside Grocery. This card and No. of Sales are connected; Gas Volume, Gas Grades, No Sale, Void Line and Suspended Transactions remain unavailable in this view. Grocery Sales reflects the selected sale dates, not available stock. Frontend TypeScript/build checked.


### Live Counter Gas Volume connected; POS event schema reviewed — test (2026-09-13)

Gas Volume now aggregates same-store Fuel/Gas department sale lines whose recorded unit is gallon/gallons/gal. Completed sales add gallons; completed/refunded returns and refunds subtract absolute gallons; voided/open transactions are excluded. Uses the existing date, terminal and transaction filters and aggregates independently of pagination. This is sold volume, not sample available stock, configured tank volume or product prices. Gas Grades remains pending.

No schema changes. Deployed backend to test8181 and HMR UI5173 only. All52 ScopedAccessIntegrationTest cases passed, including new gallon precision, refund, void exclusion, unit exclusion, terminal/date filter and pagination checks. Backend package, frontend TypeScript/build and browser receipt/filter/export checks passed. Latest2026-08-06 browser volume9.227gal matches the saved source lines.

Inspected actual test schema: no dedicated no-sale/void-line/suspension table. Existing sales.transaction_type permits SALE/RETURN/VOID/REFUND; sales.sale_status permits OPEN/COMPLETED/VOIDED/REFUNDED. sales_items has no line status or void metadata. Pending proposal (not applied): extend transaction type for NO_SALE and sale status for SUSPENDED; add line-void status/reason/time/actor metadata to sales_items. Retain voided rows for receipt history and exclude their amounts/quantity from sales aggregates. Record transitions for audit so resuming a suspended transaction preserves its history; a separate business table is not required for initial support. The imported workbook has only completed sales, so no real examples of these events are present. User requested inspection, not schema mutation.


### Daily Store Closing connected — test (2026-09-13)

User requested opening cash100 for Store1 and150 for Store2, occasional counting differences, sample cash activity until POS connection, and Daily Closing integration. Applied the explicitly approved Backend/db/proposals/20260913_daily_closing_connection.sql after backup Backend/backups/dgt_test_before_daily_closing.dump. Reuses everyday_closing, daily_closing_tenders and daily_expenses. Adds9columns total: stores.default_opening_cash plus closing business_date, closing_status, opening_cash, cash_added, cash_drops, notes, is_sample and sales_snapshot. Adds a unique store/business-date index. No new tables; test remains101tables. Production schema/runtime unchanged.

Connected Everyday Closing Reports → Dashboard/Store to the existing monthly closing table and Business Date Details layout; Reports → Daily Summary and Monthly Totals use recorded data. Preserved month/calendar controls, Money In / Money Out accordions, draft/close actions, status display and report tables. Added working Summary, Start Day, Save Draft, Close Day, print and CSV export. Latest recorded date selects the initial month, preserving historical workbook dates. Explicit loading/error states prevent failed metadata requests appearing as zero reports. A browser-discovered metadata SQL alias issue was fixed and covered by a regression assertion.

Store-scoped admin/manager APIs use local business-day boundaries and recorded completed sales/payments, including refunds and fuel gallons. Opening float is not sales revenue. Expected drawer cash = opening + net CASH payments + added cash - cash payouts - drawer-to-safe cash drops. Counted closing cash minus expected cash gives over/short. Tax is already included in displayed recorded sales and is not added twice. Cash drops are not represented as bank deposits or bank settlement. Source payment tender snapshots preserve payment counts; non-cash payment amounts do not assert bank reconciliation.

Saving recalculates server totals and rejects invalid/negative cash, future dates, stale versions and changed sales/payment sources. Close Day freezes sales/payment/department breakdown in a saved snapshot; closed records cannot be edited through the connected flow. Existing audit events record saves and closes. No sale/inventory movements are created by daily closing.

Sample cash records: August1–6,2026 for both existing stores (12records). Four closed and two draft days per store; normal opening100/150, two opening-count variations (-2,+1.50), cash additions/payouts/drops and closing variance -3 onAug3/+2 onAug6. All are explicitly labelled sample cash. Script Backend/scripts/imports/seed_daily_closing_test.py targets test8181, requires test-admin credentials and skips existing days. The imported980sales/$26,827.12 remain unchanged; no Store1 sales copied to Store2. Default cash values were set only for DGT-1017/Store1 and DGT-1018/Store2.

Validation: all53 ScopedAccessIntegrationTest cases passed, including metadata, refund-aware cash, draft persistence, validation, stale writes/source changes, immutable closed snapshots, cashier denial and store isolation. Backend package, TypeScript and frontend build passed. Browser verified both store defaults, original-date month, Store1Aug6 expected147.03/count149.03, Save Draft, collections view and export. Store2Aug6 expected147/count149 with no imported sales. Store1Aug1–6 CSV reconciles6days, sales1436.85, sample drops139.88 and total variance-1.

Runs on test UI5173/backend8181 with app.daily-closing.enabled=true. POS/Z-reading ingestion, bank deposits/settlements, specialized Deli/Check Cashing reports, service commissions and attachments remain separate pending integrations. Unsupported specialized report tabs are disabled rather than showing sample results inside the connected Reports page. No production release performed.


### Daily Closing sample cash expanded to full workbook period — test (2026-09-13)

Expanded test cash coverage to every May1–August6,2026 date in Store1 and Store2:98days each,196closings total. Preserved the12existing August records and created184additional records using the connected closing API. Each store now has33draft and65closed days. Opening defaults remain100/150 with two illustrative opening-count differences per month. Sample scenarios include balanced/no-movement days, added cash, payout-only, drop-only, mixed activity, small/large shortages and overages, zero closing cash and leaving the normal float. Fourteen records have zero counted drawer cash (seven per store). All added records are labelled sample cash; source sales and payments are untouched.

Backup: Backend/backups/dgt_test_before_full_period_cash.dump. Extended Backend/scripts/imports/seed_daily_closing_test.py using deterministic daily amounts and preserving existing days. Backend/scripts/imports/verify_daily_closing_test.py verified all196cash equations through the API, all98dates per store, Store1 source sales26827.12 and Store2 source sales0. Negative values, overprecision, excess payouts, stale versions, future dates and closed-day edits were rejected, with the checked draft version unchanged. No additional schema/runtime/production changes.

User testing guide: docs/DAILY_CLOSING_TEST_CASES.md, including specific May dates for each scenario. Monthly report date ranges remain up to31days; choose May, June, July and August to review the full source period. This cash coverage does not invent missing no-sale, void-line or suspended POS events.


### Original Daily Closing fields restored — test (2026-09-13)

User requested their original UI after the connected version changed its fields. Restored the unchanged MoneyInSection and MoneyOutSection components (all19original accordion groups, exact labels/order), plus the original NotNeededTab sections. Restored original footer labels and friendly business-date heading. A scoped field adapter supplies saved Opening Cash, Cash Expenses, Closing Cash, actual sales tax and aggregate merchandise/fuel values without replacing the original fields. Unsupported detailed fields remain visible as disabled dashes; aggregate data is not incorrectly relabelled as individual grades, cigarette pack/carton sales, bank settlements or service amounts. Existing cash additions/drops/notes remain editable through Cash Details and are preserved by saving.

Restored Daily Summary original Services/Z Reading and Collections Credit/Deposits columns. Actual credit-card payments populate Credit; total collections include all recorded tender types. Missing bank deposits and POS Z readings remain dashes; safe drops are not relabelled as bank deposits. No backend/schema/seed changes. All196sample closing records retained.

Validation: application TypeScript and frontend build pass; browser verified all19daily sections, restored secondary sections, original cash-field values, retained cash drops and Save Draft. Test UI5173 updated; production unchanged.

### Daily Closing — six requested reconciliation sections (test, 2026-09-13)

Connected transaction breakdowns (grocery tax/non-tax, cigarette pack/carton, fuel grades), recorded EBT/fleet payments, persisted cash purchases/deposits, card settlement statement entries, lottery statement entries, check balances and previous-closed-day carryforward. Original accordion layout retained. Detailed statement entries are saved inputs, not automated bank/lottery feeds. Older closed snapshots remain unchanged. Mixed-tender fleet gallons need POS line attribution. ATM/gift-card/bill-pay/money-transfer/other-income expansion remains outside this change. Approved test schema adds 16 columns across existing closing/deposit tables, no tables; production unchanged.

### Daily Closing released (2026-09-13)

The six requested reconciliation sections and connected Live Counter/Daily Closing build are now on production UI 5175/backend 8182. Production schema release applied after backup; 101 tables unchanged, zero test closing records copied. Production read-only browser verification passed. Original layout retained. Card/lottery statement values are saved entries, not automatic external feeds. See CHANGE_LOG release entry for artifacts and rollback backup.
