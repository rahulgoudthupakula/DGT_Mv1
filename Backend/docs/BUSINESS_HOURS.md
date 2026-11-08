# Business hours preview

Migration: db/proposals/20260910_business_hours.sql. Applied only to dgt_test. Real dgt must not run this build before both timezone and business-hours proposals are reviewed and applied with a backup.

One interval per weekday. SCHEDULED uses different local opening and closing times; closing earlier means the next calendar day. CLOSED and OPEN_24_HOURS have null times. Missing days and UNSET display blank. Existing intervals retain SCHEDULED; ambiguous equal-time legacy records require review, not automatic conversion. The SQL check is NOT VALID to preserve legacy data; validate it after reviewing those records before release.

The Store Account Overview keeps its cards and edits hours in the existing dialog. Store timezone supplies the local-time context; no conversion to a fixed UTC offset occurs. This is a recurring schedule, not an instant-based open-now calculator. Holiday overrides and multiple intervals per day are not implemented.

GET/PATCH /api/v1/stores/{dgtId}/settings includes hours. PATCH supplies seven weekday records and an hoursVersions map from day_of_week to _version, along with the existing store If-Match. Store, contact and hours save transactionally. Parent row locking serializes saves through this settings endpoint. Legacy generic business-hours CRUD remains available to preview administrators; company permissions and production-wide write coordination must be finalized before release.

Verified: backend package, frontend TypeScript and production build; live test API empty/create/read, overnight, closed, 24-hour, stale version rejection, equal-time rejection/rollback and clearing a day. Temporary fixture removed. Interactive browser review remains pending.
