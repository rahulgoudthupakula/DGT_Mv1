Latest UI: role tables use Edit / Save Preferences / Cancel. Batch endpoint PUT `/api/v1/access/stores/{store}/role-permissions/batch` accepts `{changes: [{roleTypeId, code, allowed, version}]}` and saves atomically. The 15-test suite includes batch rollback and conflict checks. Historical immediate-save table instructions below are superseded.

# Current role-permission testing flow

This section supersedes the historical individual-user permission instructions below.

1. Sign in as admin@dgt.test at localhost:5173 (test password unchanged). Open Roles & Permissions for DGT-1001.
2. Use the Store Permissions, Grocery Permissions, and Lottery Permissions role columns. Click Edit on a table, change its checkboxes, then Save Preferences to save together or Cancel to discard. Admin always has full access. Enable View before Edit; removing View removes Edit.
3. Add User now asks for account details, role, and store assignments only. New users inherit their role's permissions in each assigned store. Individual rows allow activation/deactivation, not permission overrides.
4. Verify two managers in the same store receive the same Store Account Overview/Department access. Change a Manager permission and sign in as each manager again. Verify another store's access stays unchanged.
5. Grocery/Lottery selections are saved configuration only: these business screens and endpoints remain unavailable pending implementation.

API: GET/PUT `/api/v1/access/stores/{store}/role-permissions`. PUT body: `{roleTypeId, code, allowed, version}`; absent row version is `"0"`. Conflicts return 409. Individual `/permissions` PUT returns 410. New-user POST omits `modules`.

Database: new `store_role_permissions` table in dgt_test only. Backup and migration are recorded in CHANGE_LOG.md. Automated integration suite: 14 passing tests. Browser review remains pending.

---

Historical notes (individual permission behavior below is superseded):

# Roles & Permissions test preview

## Implemented scope

Store Account Overview and Department Access now use company/store authorization. Roles & Permissions manages existing company users' store-role assignments and module view/edit grants. Company-admin memberships are explicitly bootstrapped; there is no UI/API to grant or remove company-admin membership yet.

- Company admin: full access to the two connected modules within assigned company only.
- Manager: assigned stores/module grants. Edits apply immediately unless the company/module policy requires admin approval.
- Cashier: edits create pending requests requiring assigned-store manager or company admin review.
- Accountant: seeded view-only. If granted editing, changes follow cashier approval rules.
- Module editing implies viewing. Active user/account/company/role/module/permission flags are checked by the backend.
- Role assignment can be activated/deactivated. New assignments start without module grants. Users must belong to the same company for assignment through this interface.
- Default department definitions stay protected. Only selected-store status is mutable; no department deletion.
- Stale proposals return 409 and remain pending until cancelled/rejected/resubmitted. Repeated/parallel decisions cannot apply changes twice.
- Submission validates through a savepoint and rolls trial writes back before queuing. Identity sequences may advance during validation; gaps are expected.

## Test logins

All use the existing local test password `test-only-password` (never use these accounts/passwords in production).

| Email | Company/store | Behavior |
|---|---|---|
| admin@dgt.test | Company A / DGT-1001 | Company admin |
| manager@dgt.test | Company A / DGT-1001 | Manager, view/edit both modules |
| cashier@dgt.test | Company A / DGT-1001 | View/edit both modules; edits require approval |
| accountant@dgt.test | Company A / DGT-1001 | View only by default |
| reader@dgt.test | Company B / DGT-1002 | Separate company admin for isolation testing |

The previous MFA fixture remains disabled for Basic login. Roles are test-only; the real database's admin login is separate.

## Browser review

1. Open http://localhost:5173 and log in as admin. Profile → Access & Integrations → Roles & Permissions.
2. Select a user/store-role assignment; change view/edit grants. Changes save immediately. Assign another existing company user a store role if needed, then grant the desired modules.
3. Log out and log in as cashier. Submit a store edit, new department or status toggle. Confirm a pending notification and unchanged business values.
4. Log in as manager/admin. Open Change Approvals, inspect the proposed fields, and approve or reject. Refresh the relevant page to view the result.
5. Enable manager approval for a module as admin; manager changes should then queue for admin review. Policy applies company-wide for that module.
6. Log in as accountant and confirm edit controls are disabled until granted editing.
7. Log in as reader@dgt.test and confirm only DGT-1002 is visible. Original defaults still contain 32 departments and 453 subdepartment entries.

Refresh requires login again because credentials stay in memory. Browser review remains manual; no automated browser tool was available in this session.

## API contract

All routes require HTTP Basic except /api/v1/health. Store IDs below are dgt_id. Existing generic/unfinished routes are denied, even to company admins. Supabase/mock screens outside the two connected profile pages are not mounted in this scoped preview. Existing layouts remain in source for later integration.

| Method/path under /api/v1 | Purpose |
|---|---|
| GET /access/me | Authenticate current active account |
| GET /access/stores | Company-admin stores or active role-assigned stores |
| GET /access/stores/{store}/context | Current admin flag and module rights/approval requirement |
| GET /access/stores/{store}/permissions | Admin-only assignments, eligible company users, roles, modules, grants and policies |
| PUT /access/stores/{store}/roles | Admin-only `{userId,roleTypeId,active,version}`; version 0 for new assignment |
| PUT /access/stores/{store}/permissions | Admin-only `{roleId,moduleId,view,edit,version}`; version 0 for new grant |
| PUT /access/stores/{store}/approval-policy | Admin-only `{moduleId,required,version}`; version 0 for new policy |
| GET /access/stores/{store}/approvals | Up to 200 recent own requests or requests the user can review |
| POST /access/stores/{store}/approvals/{id}/decision | `{decision: APPROVED/REJECTED/CANCELLED, note?}` |
| GET/PATCH /stores/{store}/settings | Scoped settings read/write submission |
| GET/POST /stores/{store}/department-access | Scoped catalog read/department creation submission |
| PATCH /stores/{store}/department-access/{id} | Scoped department activation/deactivation submission |
| GET /stores/{store}/business-day?date=YYYY-MM-DD | Scoped timezone-aware business-day boundaries |

Settings/departments writes require Idempotency-Key UUID; updates also require If-Match from the last read. Immediate writes return their usual data. Queued writes return `{pending:true,requestId,status:"PENDING"}` with existing endpoint HTTP 200/201 status. The frontend distinguishes this envelope from an applied change. Permission/role/policy writes use version in the body. Decisions lock and revalidate the request, requester access and policy before applying an allowlisted operation in the same transaction.

## Verification

ScopedAccessIntegrationTest: 11 tests, zero failures/errors. Covers company/store isolation, denial of generic bypasses, accountant defaults/revocation, manager policy, self-approval prevention, idempotent submission, repeated and parallel decisions, pending-value visibility, stale rollback, ownership-field protection, role reassignment/deactivation, successful approved contact/settings persistence, daylight-saving boundary and audit presence.

Fixtures are isolated by generated company/user names, restricted to dgt_test, and cleaned up. The old truncate-all/allowlist-dependent SchemaIntegrationTest was archived at Backend/archive/SchemaIntegrationTest.before-scoped-access.java.txt; it is not represented as passing under the new security contract.

Backend `mvn verify`, frontend TypeScript and production build passed. Running preview verified all five logins and default catalog. Remaining before real release: browser review, explicit real company assignments, production authentication/session design, company-admin management, full audit review tooling, and each remaining module's ownership/permission/approval integration. No real release was performed.

### Add User
Sign in as `admin@dgt.test`, open Roles & Permissions, and click **Add User**. Enter first/last name, employee ID, email, and a password (minimum 12 characters, maximum 72 UTF-8 bytes). Select Manager, Cashier, or Accountant and check module View/Edit. Managers may select additional company stores; identical initial permissions apply to each selected store. Accountants begin with edit unchecked. Save, then click Edit Access beside the account in the store user list to adjust access. Sign out and sign in with the new email/password to verify permissions. No email is sent.

API: `POST /api/v1/access/stores/{store}/users` accepts `firstName`, `lastName`, `employeeId`, `email`, `password`, `roleTypeId`, `stores` (including current store), and `modules: [{moduleId, view, edit}]`. Returns 201 with `userId` and `email`; duplicate account identifiers return 409. Saving is atomic and company-admin only. No new schema fields. Automated suite now has 13 passing tests; browser testing remains manual.
