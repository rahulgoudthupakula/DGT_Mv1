# Roles & Permissions — proposed implementation

Status: implemented in dgt_test for Store Account Overview and Department Access. See ROLES_PERMISSIONS_TESTING.md for the implemented contract, tests and remaining scope. The original plan below is retained for reference.
SQL: Backend/db/proposals/20260911_roles_permissions_test.sql. Applied to dgt_test with user approval; guard restricts it to that database. Real dgt requires a separate reviewed release migration and backup.

## Rules to implement

- Company admin: full access only within assigned companies; administrative membership is explicit. A role named Admin alone never grants global access.
- Manager: access through active user_roles rows for assigned stores, with module view/edit grants.
- Cashier: assigned stores/modules; approved editing creates pending requests, not immediate business writes. Assigned-store manager or company admin can review.
- Accountant: starts view-only for granted modules. Admin may enable editing, which requires the same approvals as cashier edits.
- Manager edits require company admin review only where configured. No manager modules are selected by default, per the user's deferred decision.
- No self-approval, no deletion of departments. Activate/deactivate remains available through the authorized/approved workflow.
- A permission grant is scoped to a user's role assignment and store. Existing UI role columns are not proof that permissions apply to every user of that role.

## Proposed schema

| Object | Change |
|---|---|
| companies | New company identity/active-state table |
| stores.company_id | New nullable bigint FK and index; existing stores remain unassigned pending explicit mapping |
| company_admins | New company/user memberships with active state and composite primary key |
| permissions.can_view / can_edit | New non-null booleans default false; CHECK editing implies viewing |
| module_approval_policies | Per-company/module manager approval switch; unset means no extra manager approval |
| approval_requests | Store/company/module, requester/role, approved operation identifier, proposed fields, target versions, decision state, reviewer, idempotency key |
| access_audit_events | Record permission/membership/policy/approval changes with actor and timestamps; never log credentials |

Existing module, role and user/store-assignment tables remain. No automatic Viewer-to-Cashier conversion. Permission backfill recognizes only Admin/Manager/Cashier/Accountant (case-insensitively); active accountants receive viewing only. Unrecognized/inactive grants receive no new rights. Review existing role/module names and duplicate semantic names before application.

## Implementation order

1. Inspect actual dgt_test roles/modules/users and review the permission backfill. Back up test data. Apply only after approval. Add generated mappings and schema metadata; rerun schema verification.
2. Seed a clearly labeled test company and explicitly selected test users/stores. Ensure the existing test admin retains a reviewed company membership before replacing the email allowlist. Never group real stores by assumption.
3. Add authorization services that resolve authenticated user, active company membership/store role and module grants. Store identity is derived from the target row; validate supplied dgt_id. Apply filters to collection reads and joined resources as well as detail/update APIs. Reject unmapped companies. Unconnected modules remain denied to ordinary users.
4. Connect Roles & Permissions UI within existing cards. Replace Viewer with Cashier display, add view/edit controls, and provide user/store assignment context so admin edits affect the intended person. Keep unimplemented operation controls disabled/blank. Store permission management is admin-only; protect the last active company admin from accidental removal.
5. Add transactional pending-change services for Store Account Overview and Department Access first. Cashier/accountant submit validated changes and see pending status. Business tables change only when an authorized reviewer approves. Admin/manager immediate changes follow configured rules.
6. Add queue/list/detail/review/cancel APIs and UI. Approve atomically: lock request/targets; recheck company/store scope, active accounts, current requester rights and approval policy; validate current row versions and payload; apply allowlisted operation handler; append audit and decision. Repeated approval cannot reapply. Stale proposals require resubmission. Permission removal before review prevents the former user’s pending write from taking effect.
7. Close bypasses in generic CRUD, reports and special endpoints before enabling non-admin accounts. No arbitrary SQL/table mutation from approval JSON. Permission tables and identity administration never use the generic write path. Test the full authorization boundary, not just frontend visibility.
8. Update tracker, change log and rollout notes. Browser review and explicit real-database release approval follow test completion.

## Important design boundaries

- Company consistency across company_id, dgt_id, role assignment and resource ownership must be checked transactionally by services; simple foreign keys alone do not enforce it.
- Global shared catalogs currently lack company ownership. Never grant company-scoped users blanket writes to globally shared rows. Review ownership for products/vendors/subscription plans before enabling these writes. Existing protected global department definitions remain read-only.
- Multi-role aggregation must be explicit: company admin overrides within that company; otherwise use an authorized manager assignment if present, then cashier/accountant assignments. Never let a client choose a role to bypass approval. All active-state and scope checks still apply.
- Proposed manager policy is company/module-wide. Store-specific policy overrides are not part of this proposal.
- Status/operation changes use controlled services. Access audit has no update/delete API. Payloads contain only allowlisted business fields, not passwords/tokens.
- Existing login remains Basic for local testing; production session/authentication design is a separate task. Signup and MFA remain deferred.

## Validation checklist

- Cross-company and cross-store reads/writes denied, including forged ids and lists.
- Accountant read-only default; edit grant queues changes; revocation enforced.
- Cashier cannot save directly, grant access, review own request or call legacy bypass endpoints.
- Manager approves only assigned-store cashier/accountant requests; company admin can approve within company.
- Configured manager changes require admin; admin cannot approve their own pending request.
- Stale target versions, parallel/repeated approvals and rollback are safe.
- Permissions, proposals and membership changes are audited without credentials.
- UI refresh/store switching preserves correct permission context; pending submissions are not shown as completed writes.

## Decisions needed before activation

- Explicit company-to-store and company-admin assignments for any real deployment.
- Ownership of shared product/vendor/subscription data before enabling those module writes.
- Manager approval-module choices can stay deferred; defaults described above are explicit.

Preparing this proposal does not mean the full authorization or approval system is implemented.
