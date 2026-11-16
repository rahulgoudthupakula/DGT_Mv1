# Time & Attendance

Local implementation reuses `employee_time_entries`, published schedules and approved
`workforce_leave_shifts`. It does not read mock employees or infer punches from sales.

## Receiving actual punches

The connector contract is `POST /api/v1/pos/time-entries`, authenticated with the same
store-bound connector credential as sales. Example normalized interval:

```json
{
  "version": 1,
  "dgtId": "DGT-1017",
  "sourceSystem": "VERIFONE_COMMANDER_SIMULATOR",
  "sourceEntryId": "timeclock-stable-work-interval-id",
  "cashierCode": "C001",
  "clockIn": "2026-11-10T08:00:00-05:00",
  "clockOut": "2026-11-10T16:00:00-05:00"
}
```

The employee code must have an explicit connector CASHIER mapping. Timestamps must
contain offsets. A source entry ID identifies one uninterrupted worked interval;
exclude unpaid breaks by sending separate intervals, each with its own stable ID.
Never guess break times. Null clock-out records an open punch; retry with the same
identity/start and a clock-out to complete it. Identical retries return DUPLICATE.
Completed entries cannot be overwritten. Overlap checks are serialized per employee
across stores. Errors do not write time entries; the sender must retain rejected
records for review and retry after fixing mappings. This endpoint does not create
employees, change inventory, write sales, or post payroll.

**The existing POS integration remains simulator-only and blocked in production.**
The sibling connector currently sends sales only; a real POS/timeclock adapter must
supply this attendance contract and route it to `/time-entries`, retaining the
original stable IDs through retries. This change does not establish a live hardware
connection, and the simulator guard must not be switched off to claim production
support. The real source export/API and unpaid-break semantics still need to be
verified with an actual attendance sample.

## Reporting and calculation

- GET `/api/v1/access/stores/{store}/attendance?week=YYYY-MM-DD`: small weekly summary.
- GET the same route plus `/{employee}`: punch details, fetched only when opened.
- PUT the same route plus `/settings`: company admin only; body contains
  `weeklyOvertimeHours` and the current settings `version`.
- Requires Workweek module and Time & Attendance page permission. Company admins,
  active store managers and accountants can see scoped store employees; other users
  can see only their own employee record.
- Sunday–Saturday weeks use the store timezone. Worked durations use elapsed time,
  including across DST, clipped to week boundaries. Open punches contribute no
  worked hours. Weekly overtime defaults to 40 actual worked hours, independent of
  schedules and leave. The configurable store threshold recalculates historical
  attendance views too; no payroll records are changed. It is an attendance setting,
  not a complete payroll rules engine.
- Scheduled hours use published shifts; approved leave remains separate. A past
  shift without an overlapping punch is a review warning, not an absence/no-show.
- The browser refreshes every 30 seconds; no persistent attendance cache is used.

## Rollout

V26 adds connector source identity columns/indexes to the existing time-entry table
and one small store-settings table. V23–V25 are separate pending return-work migrations.
Run migrations before releasing the app. No production migration or deployment is
part of the local implementation.
