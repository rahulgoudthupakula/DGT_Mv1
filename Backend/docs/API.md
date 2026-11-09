# API reference

Base URL: `http://localhost:8080/api/v1`. Send JSON request bodies and an `Authorization: Basic ...` header. `/health` is public. `GET /auth/me` verifies credentials and returns the current username and permission codes. Passwords/hashes are never returned by user APIs.

## Conventions

Request record fields use camelCase. Database-backed response fields currently use snake_case (`store_id`, `created_at`, `unit_price`). UUIDs and dates are strings; amounts and quantities are JSON numbers. Use decimal handling in financial clients. Full request fields and validation bounds are in [openapi.json](../src/main/resources/static/openapi.json).

Catalog collection GETs return `{ "items": [...], "page": 0, "size": 50, "total": 0 }`. Pagination is zero-based, with a default of 50 and maximum of 200. Workflow collection GETs use the same envelope, except inventory and movement queries return arrays filtered by the required store ID. Identity and report endpoints return arrays or the explicitly described object.

Catalog POSTs return the new row and HTTP 201. PUTs return the updated row and HTTP 200. Supply the complete request body and `?version=0` (or the version from the latest GET). A stale version returns 409. Null optional fields clear their previous values. There is no PATCH or DELETE.

Validation returns 400; authentication failures return 401; missing permissions return 403; missing records return 404; duplicate keys, invalid database relationships, business conflicts and stale versions return 409. Application validation and business errors use problem-detail JSON. Retry a failed request only after inspecting the response, particularly inventory adjustments, which do not have idempotency keys.

## Catalog routes

Each of these supports `GET /resource?page=0&size=50`, `GET /resource/{id}`, `POST /resource`, and `PUT /resource/{id}?version=N`:

| Resource | Required permission prefix | Request fields |
| --- | --- | --- |
| stores | catalog | code, name, address, timezone, active |
| departments | catalog | name, active |
| subdepartments | catalog | departmentId, name, active |
| products | catalog | sku, name, subdepartmentId, unit, taxRate, active |
| product-barcodes | catalog | productId, barcode, unitsPerScan |
| vendors | catalog | name, email (optional), phone (optional), active |
| product-vendors | catalog | productId, vendorId, vendorSku, unitCost |
| product-store-prices | catalog | storeId, productId, price |
| promotions | catalog | storeId, productId, name, discountPercent, startsOn, endsOn, active |
| employees | payroll | storeId, employeeNumber, name, hourlyRate, active |
| fuel-tanks | catalog | storeId, name, grade, capacity |
| lottery-games | catalog | gameNumber, name, ticketPrice, active |
| subscription-plans | billing | name, monthlyPrice, active |
| subscriptions | billing | storeId, planId, startsOn, endsOn, status |

GET requires `<prefix>:read`; POST/PUT requires `<prefix>:write`. Product department is derived through its subdepartment. Barcodes are strings so leading zeros are retained. `taxRate: 0.075` means 7.5%. Subscription status is `ACTIVE`, `CANCELLED` or `EXPIRED`; date constraints are also enforced at invoice creation.

`GET /barcode-lookup?barcode=...&storeId=...` requires `catalog:read` and returns product details, `units_per_scan`, current `price` and `quantity`. Price/quantity can be null when not configured. Checkout quantity is in product base units; the scanning client must multiply scans by `units_per_scan`.

## Identity

| Method/path | Behavior |
| --- | --- |
| GET /auth/me | Current username and permissions |
| POST /auth/change-password | `{ "currentPassword": "...", "newPassword": "..." }` |
| GET /users | IDs, usernames and enabled states |
| POST /users | `{ "username": "...", "password": "...", "roleIds": ["uuid"] }` |
| GET /users/{id}/roles | Assigned role IDs and names |
| PUT /users/{id}/access | `{ "enabled": true, "roleIds": ["uuid"] }`; replaces all assignments |
| GET /roles | Available roles |
| POST /roles | `{ "name": "MANAGER", "permissions": ["catalog:read", "catalog:write"] }` |
| GET /roles/{id}/permissions | Permission codes assigned to a role |
| GET /permissions | Supported permission codes |

User/role/permission management requires `identity:manage`. Own-password changes require only authentication and verification of the current password. Role definitions are immutable through this initial API; create another role and change assignments to modify access. User self-access changes are rejected.

Seeded ADMIN ID: `00000000-0000-0000-0000-000000000001`. Seeded CASHIER ID: `00000000-0000-0000-0000-000000000002`. Cashiers can read catalog and inventory, and read/write sales. All these permissions apply to all stores in this deployment.

## First sale walkthrough

Create a store, department, subdepartment, product, and price in that order using the catalog endpoints. Retain the UUID returned by each POST.

Store example:

```json
{"code":"STORE-001","name":"Main Street","address":"123 Main St","timezone":"America/New_York","active":true}
```

Product example (replace the subdepartment UUID):

```json
{"sku":"WATER-001","name":"Bottled water","subdepartmentId":"00000000-0000-0000-0000-000000000000","unit":"EACH","taxRate":0.075,"active":true}
```

Set its store price via `POST /product-store-prices`:

```json
{"storeId":"<store UUID>","productId":"<product UUID>","price":2.50}
```

Receive stock with `POST /inventory/adjustments` (`inventory:write`):

```json
{"storeId":"<store UUID>","productId":"<product UUID>","delta":24,"reason":"RECEIPT","reference":"INVOICE-001"}
```

This returns the balance. Reasons are `RECEIPT` (positive), `SHRINKAGE` (negative), or `ADJUSTMENT` (either nonzero sign). Stock cannot go negative. `GET /inventory?storeId=<UUID>` and `GET /inventory-movements?storeId=<UUID>` require `inventory:read` and accept page/size. Movements cannot be edited via the API.

Send `POST /sales` with a unique `Idempotency-Key` header (`sales:write`):

```json
{"storeId":"<store UUID>","paymentMethod":"CASH","lines":[{"productId":"<product UUID>","quantity":2}]}
```

Allowed tenders: `CASH`, `CARD`, `OTHER`. The API determines price, promotion and tax. The response contains the sale and its `lines`. The example totals 5.38 with no promotion. Sales are dated using the store timezone. Same-key/same-ordered-request retries return the original sale, also with 201; different payloads return 409. Keys are globally unique within the deployment. `GET /sales` and `GET /sales/{id}` require `sales:read`.

## Operational records

Each of the following has a paginated GET and a POST. Reads require `operations:read`; writes require `operations:write`. POST returns the calculated row with 201.

`POST /fuel-readings`:

```json
{"tankId":"<tank UUID>","businessDate":"2026-01-01","openingVolume":500,"deliveredVolume":100,"soldVolume":200,"closingVolume":395}
```

Variance is `closing - (opening + delivered - sold)`, here -5. All volumes use the same configured business unit. One reading per tank/day; opening and closing cannot exceed capacity. Continuity with a preceding day's reading is not enforced.

`POST /lottery-settlements`:

```json
{"storeId":"<store UUID>","gameId":"<game UUID>","businessDate":"2026-01-01","ticketsSold":10,"payouts":20}
```

Sales amount uses the current game's ticket price, which is snapshotted in the settlement. Net is sales minus payouts. One settlement per store/game/day. Payouts can exceed sales.

`POST /daily-closings`:

```json
{"storeId":"<store UUID>","businessDate":"2026-01-01","openingCash":100,"cashPaidOut":10,"countedCash":195.38}
```

Expected cash is opening cash + recorded POS cash sales - cash paid out. Variance is counted minus expected. Future dates and duplicate store/day closings are rejected. Closing today's business date prevents further checkouts today; retries of already-recorded sales still succeed. This is POS cash reconciliation; fuel/lottery totals do not feed it automatically.

## Payroll

`GET /payroll?page=0&size=50` requires `payroll:read`. `POST /payroll` requires `payroll:write`:

```json
{"employeeId":"<employee UUID>","startsOn":"2026-01-01","endsOn":"2026-01-07","regularHours":40,"overtimeHours":5,"overtimeMultiplier":1.5,"deductions":100}
```

The API snapshots the employee's current hourly rate. At 20/hour this produces gross 950 and net 850. Periods for the same employee cannot overlap. Deductions cannot exceed gross. This does not compute statutory deductions or overtime eligibility.

## Billing

`GET /billing-invoices` requires `billing:read`. Writes require `billing:write`.

`POST /billing-invoices`:

```json
{"subscriptionId":"<subscription UUID>","periodStart":"2026-01-01","periodEnd":"2026-01-31"}
```

An invoice covers one full month (`periodEnd = periodStart + one month - one day`) within an active subscription. The API snapshots the current plan's monthly price. Overlapping invoice periods are rejected. It creates a DRAFT internal invoice.

`POST /billing-invoices/{id}/record-payment`:

```json
{"externalReference":"bank-transfer-123"}
```

Marks a draft PAID and timestamps it. This records an already-completed external payment; it does not move funds. Repeated payment recording returns 409.

## Reports

Both require `reports:read`:

- `GET /reports/sales?storeId=<UUID>&from=2026-01-01&to=2026-01-31`: inclusive date range, grouped by day/tender with transaction count, subtotal, tax and total. Maximum range one year.
- `GET /reports/inventory?storeId=<UUID>&page=0&size=50`: stock with current retail price and retail valuation. Missing price yields null valuation; it does not calculate cost of goods or accounting inventory value.
