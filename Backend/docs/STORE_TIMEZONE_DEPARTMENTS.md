# Proposed store timezone and department changes

Status: prepared and tested in `dgt_test`; **not applied to the real `dgt` database**. The SQL is in [20260910_store_timezones_departments.sql](../db/proposals/20260910_store_timezones_departments.sql). No automatic migrations are enabled.

## Database changes

- Add nullable `stores.timezone VARCHAR(80)`. No default or backfill: existing stores remain unset until their timezone is selected. A PostgreSQL trigger checks timezone names against its installed timezone catalog. The API additionally checks the Java IANA timezone catalog.
- Make `store_departments.department_id` nullable so custom departments are owned solely by their store, without modifying global defaults.
- Default new `store_departments.source_type` to `CUSTOM`. New DEFAULT assignments require a global department ID; new CUSTOM definitions must not reference one.
- Add `store_sub_departments.source_type`. Existing rows become `UNCLASSIFIED`; new rows default to `CUSTOM`. Existing default/custom ownership must be reviewed rather than inferred from names or parent departments.
- The department source constraint is deliberately `NOT VALID`: it enforces new/updated rows without failing or rewriting legacy linked CUSTOM rows. Before separately validating it, review rows where source_type is neither a DEFAULT with a department_id nor a CUSTOM without one. Their API edits remain blocked.

The migration is transactional with a five-second lock timeout. It is intended to run once. It does not rename store IDs, change billing/POS foreign keys, add companies or permissions, delete records, or implement approval processing.

## API behavior

All examples require the currently configured administrative account. The module/company permission and change-approval system remains separate pending work. These rules do not grant cashiers direct write access.

Select a timezone using `PATCH /api/v1/stores/{dgt_id}` and `If-Match: <latest _version>`:

```json
{"timezone":"America/New_York"}
```

Other stores can select `America/Chicago`, `Asia/Kolkata`, `Europe/London`, etc. Numeric offsets and server-local timezone guesses are not accepted. `null` denotes incomplete setup.

`GET /api/v1/stores/{dgt_id}/business-day?date=2026-03-08` returns:

```json
{
  "dgtId":"DGT-1001",
  "timezone":"America/New_York",
  "date":"2026-03-08",
  "startInclusive":"2026-03-08T05:00:00Z",
  "endExclusive":"2026-03-09T04:00:00Z"
}
```

The end is the next local midnight, not start + 24 hours. This supports daylight-saving and non-whole-hour offsets. An unset store timezone returns 409. A skipped local calendar date returns 400. Existing timestamps are not rewritten. This service is the conversion point for future closing/schedule workflows; those deferred workflows are not implemented by this change. The existing explicitly UTC sales summary retains its documented UTC grouping.

Create a custom department:

```text
POST /api/v1/store-departments
```

```json
{"dgt_id":"DGT-1001","store_department_name":"Local specialties"}
```

Create a custom subdepartment beneath either a custom or default store department:

```text
POST /api/v1/store-sub-departments
```

```json
{"store_department_id":12,"store_sub_department_name":"Local snacks"}
```

Custom definitions can be renamed or deactivated using PATCH with If-Match. Their parent/store/source cannot be reassigned. Existing DEFAULT and UNCLASSIFIED rows cannot be changed through these APIs. Global `departments` writes return 403; reads remain available. Assigning an existing default department to a store requires its exact default name and `source_type: DEFAULT`. Store-created subdepartments cannot be marked DEFAULT. Default seeding or reviewed classification remains a controlled database task, not a store API capability.

## Tested

- Transactional migration against a separate PostgreSQL database.
- Legacy subdepartment preserved as UNCLASSIFIED; existing store timezones remain null.
- 10 integration tests, including the previous schema API tests.
- Daylight-saving transitions with 23/25-hour days and Asia/Kolkata's half-hour offset.
- Invalid/missing timezone rejection, including invalid direct SQL writes in the test database.
- Custom creation/edits; protected defaults; ownership/source change rejection.

## Application order after approval

1. Back up the actual database and review legacy department classifications.
2. Apply the proposal SQL once to the approved database.
3. Deploy the matching backend build. Its read-only startup verifier expects the new columns.
4. Assign each store's actual timezone; separately review and classify existing subdepartments.

The new backend must not replace the running version before the migration is approved and applied. The previous inspected metadata is retained in `docs/schema/catalog.before-timezones.json`; `catalog.json` describes the proposed target. `docs/schema/schema.sql` remains the original schema export; a fresh isolated test database needs that export followed by the proposal migration.
