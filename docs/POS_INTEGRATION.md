# POS simulator integration (contract v1)

The DGT website/backend stay in DGT_Mv1. The Windows-capable connector is a separate
sibling project, `DGT_Connector`, with its own Maven build and Git history. There
is no source import or build dependency between the projects. They communicate
only through the v1 HTTP contract documented below.

This is a simulator, not a working Verifone interface. No Commander IP, port,
credential, protocol or transaction format is assumed. Inventory is not changed.

## Local setup

Use a migrated development database with a store, an administrator, an assigned
employee, active POS terminal, products and tender types. Apply V18 using Flyway;
never replay an edited migration or repair validation to force startup.

Build the backend, then explicitly enable the simulator locally:

```sh
mvn -f Backend/pom.xml -DskipTests package
APP_ENVIRONMENT=development APP_POS_SIMULATOR_ENABLED=true FLYWAY_ENABLED=true sh Backend/run-development.sh
```

Both switches are required. The default environment is production and the
simulator is disabled. Simulator creation, mapping changes and ingestion are
rejected unless environment is exactly development/testing and the flag is true.
Production deployments must not set these switches.

Open POS Settings for the development store. Create a connector and copy the
one-time credential into the separate connector's private properties file. Map:

| Kind | Simulator code | Existing DGT record |
| --- | --- | --- |
| Register | SIM-REGISTER-1 | Active terminal belonging to this store |
| Cashier | SIM-CASHIER-1 | Employee assigned on transaction's store-local date |
| Product | SIM-COLA | Your test product |
| Product | SIM-CHIPS | Your second test product |
| Tender | SIM-CREDIT | Active credit tender |

Alternatively, products can be resolved by the fixture barcodes 000000000001 and
000000000002. These are artificial test identifiers, not real product UPCs.
The simulator does not create or change master data.

Run the connector's `simulate`, then `sync` commands. Accepted transactions appear
in sales/history; missing mappings hold the entire transaction. Save the mapping
and click Reprocess. The connector retains held records; `retry-held` followed by
`sync` acknowledges the backend result after reprocessing.

## API contract v1

Connector requests use `Authorization: Bearer <connector credential>`. Credentials
are bound to one store, hashed server-side and revocable by that store's admin.
User sessions cannot substitute for a connector credential and connector credentials
cannot access employee/admin APIs.

- GET `/api/v1/pos/configuration`: dgtId, sourceSystem, scheduleMinutes (0 means manual).
- POST `/api/v1/pos/heartbeat`: empty object; reports connector reachability only.
- POST `/api/v1/pos/sales`: normalized transaction below.
- Admin endpoints live under `/api/v1/access/stores/{store}/pos`: GET settings,
  GET targets, POST connectors, PUT connectors/{id} (scheduleMinutes),
  PUT connectors/{id}/mapping (kind/sourceCode/targetId), POST connectors/{id}/revoke,
  POST history/{id}/reprocess. All require store administrator access.

```json
{
  "version": 1,
  "dgtId": "YOUR_TEST_STORE",
  "sourceSystem": "VERIFONE_COMMANDER_SIMULATOR",
  "sourceTransactionId": "unique-stable-fixture-id",
  "registerCode": "SIM-REGISTER-1",
  "cashierCode": "SIM-CASHIER-1",
  "receiptNo": "receipt-1",
  "transactionType": "SALE",
  "saleStatus": "COMPLETED",
  "saleDateTime": "2026-09-26T12:00:00-04:00",
  "subtotal": 2.49,
  "taxableAmount": 2.49,
  "taxAmount": 0.15,
  "discountAmount": 0.00,
  "totalAmount": 2.64,
  "totalItems": 1,
  "items": [{"productCode":"SIM-COLA","barcode":"000000000001","quantity":1,
    "catalogPrice":2.49,"unitPrice":2.49,"grossAmount":2.49,"discountAmount":0.00,
    "taxableAmount":2.49,"taxAmount":0.15,"lineTotal":2.64}],
  "payments": [{"tenderCode":"SIM-CREDIT","paymentAmount":2.64,
    "paymentStatus":"COMPLETED","cardBrand":"VISA"}]
}
```

Amounts are nonnegative decimal magnitudes with at most two decimal places;
quantities have at most three. Gross is quantity × unitPrice rounded HALF_UP.
Header totals must equal line sums, payments must equal total, and totalItems is
receipt line count. Barcode strings retain leading zeros. Source identity is
unique per store/source; different content with an existing identity returns 409.
Do not reuse an identity to represent a later correction.

RETURN uses COMPLETED sale status and REFUNDED payments; REFUND uses REFUNDED for
both; VOID uses VOIDED sale status and no payments. Returns/refunds use positive
magnitudes; existing reports apply direction. originalTransactionId, when supplied,
causes a hold pending lifecycle review. No existing sale is automatically reversed.

Responses contain outcome, ingestionId, saleId (nullable), reason (nullable).
201 ACCEPTED / 200 DUPLICATE / 202 HELD are durable outcomes. Invalid payloads get
422, identity conflicts 409, credentials 401, cross-store/disabled access 403.
A failed database insert rolls back receipt, sale, lines and payments together.
A held receipt is persisted separately from the sales tables and can be reprocessed.

Unknown fields are rejected. Do not send card numbers, track data, CVV, PIN,
customer data, passwords or raw vendor payloads. Only allowlisted normalized data
is queued/stored. No real customer/payment data belongs in simulator fixtures.

## Verification

```sh
mvn -f Backend/pom.xml -Dtest=PosValidationTest test
DGT_POS_TESTS=true mvn -f Backend/pom.xml -Dtest=PosIntegrationTest test
```

Integration tests use the existing local dgt_test database at 127.0.0.1:55439,
create a unique temporary schema, apply schema-qualified copies of migrations
there, and drop only that schema after tests. They do not use production.
The test opt-in is required. Connector queue/retry tests run in its own repository.

No production rollout or real Commander connection is included. Obtain official
interface/version documentation and reconcile real POS reports before enabling
any future live adapter.

To include the separately built executable in the backend integration test:

```sh
DGT_POS_TESTS=true DGT_CONNECTOR_JAR=/absolute/path/to/DGT_Connector/target/pos-connector-0.1.0.jar mvn -f Backend/pom.xml -Dtest=PosIntegrationTest test
```

The existing store-wide receipt number uniqueness constraint is preserved. A new
source identity whose receipt number already exists is held for review, not
automatically renumbered or counted twice.
