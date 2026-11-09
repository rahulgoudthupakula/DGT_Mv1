# DGT backend

Java 21, Spring Boot 4.1.1, JDBC and PostgreSQL 17. The application uses store/company-scoped APIs with feature flags. Database access uses spring.datasource; disabling SQL initialization or Flyway does not disable normal JDBC queries.

## Database migrations and deployment

See [Flyway deployment setup](../docs/FLYWAY_DEPLOYMENT.md) for fresh installations, explicit existing-database adoption, schema differences and migration rules.

Flyway is installed and opt-in using FLYWAY_ENABLED=true. Keep it disabled on existing databases until they have been reviewed and explicitly baselined. SQL initialization remains disabled. Startup schema verifiers check metadata; they do not create application users or business data.

Set DB_URL, DB_USERNAME and DB_PASSWORD through the environment. PORT defaults to 8080. Do not commit credentials.

```sh
mvn -DskipTests clean package
java -jar target/dgt-backend-0.1.0-SNAPSHOT.jar
```

Feature flags and account/store provisioning are separate from schema migrations. Preserve the deployment's intended feature configuration when changing the JAR.

## Tests

The existing ScopedAccessIntegrationTest suite requires the migrated dgt_test database on port 55439. It creates isolated fixtures and removes them. Keep Flyway disabled for this pre-existing database until its schema differences are reconciled and adoption approved.

```sh
mvn -Dtest=ScopedAccessIntegrationTest test
```

See the [change log](../docs/CHANGE_LOG.md) and feature-specific connection documents under docs for current functionality. The generated schema catalog covers the original tables; scoped modules also query the subsequently added tables.

## Access module organization

The `com.dgt.backend.access` package uses JDBC with these responsibilities:

| Folder | Responsibility |
| --- | --- |
| `controller` | HTTP routes, headers, request bodies and response status codes |
| `dto` | Named request records, preserving the existing JSON fields |
| `service` | Validation, business rules, approvals, account operations and transaction boundaries |
| `repository` | Fixed SQL statements and bound database parameters |
| `security` | JWT validation, store/module authorization, page permissions and request-local caching |
| `database` | Startup checks for required access schema columns |

For example: `ProfileController` → `ProfileService` → `ProfileRepository`. Employee account workflows call `AccessService` directly. Existing API paths, request fields, response bodies and permission rules are preserved. There is no database migration associated with this organization change. JDBC result maps remain in use; no JPA entity hierarchy was introduced.

The public `ScopedAccess.db` handle remains for existing callers in other modules; SQL inside the access module has moved to repositories (apart from startup schema checks). Approval dispatch still uses existing domain operation handlers. The reorganization does not change login configuration, token lifetime or revocation behavior.

After switching from the old flat packages, use a clean build to discard stale class files. Focused checks with mocked database access:

```sh
mvn -Dtest=AccessOrganizationTest clean test
```

These tests verify component wiring, the 26 access HTTP routes, service transaction annotations, profile version/password checks, employee overrides and invalid refresh-token handling. They do not connect to production or replace a full authenticated integration run.

## POS and pricebook package organization

POS groups HTTP endpoints and error handling in `pos.controller`, ingestion in `pos.service`, the transaction contract in `pos.dto`, connector authentication in `pos.security`, and transaction validation in `pos.validation`.

Pricebook groups its HTTP controllers in `pricebook.controller`, bulk item coordination in `pricebook.service`, and the existing SQL/catalog helpers (`ItemSellingPrice` and `DiscountTypes`) in `pricebook.repository`. Existing controller SQL and nested request records remain in place; this package reorganization does not extract a complete service/repository layer.

API paths, database schema and business behavior are unchanged. Run a clean build after updating to remove classes from their old packages:

```sh
mvn -Dtest=PosValidationTest clean test
```

## Lottery receipt reader

`POST /api/v1/access/stores/{store}/lottery-deliveries/parse-receipt` accepts
multipart form field `file` (PDF, JPEG or PNG; maximum 5 MiB). It requires the
normal authenticated DGT user, store/page access and `LOTTERY_RECEIVE_DELIVERY`.
It returns a draft with `vendor`, `invoiceNumber`, `invoiceDate` and `lines`
(description, sku/book number, quantity). Users must review and explicitly save
through the existing receipt endpoint. Parsing makes no database writes.

Set `LOVABLE_API_KEY` in the backend service environment, never in Vite or Git.
`RECEIPT_READER_MODEL` optionally overrides the previous gateway model,
`google/gemini-3.7-flash`; confirm model availability with the configured account.
Receipt documents are sent to Lovable's AI gateway. The backend does not persist
uploads or log their contents. Missing configuration returns 503, invalid uploads
400/413, unreadable output 422, busy/rate limits 429 and upstream failures 502.
Manual entry remains available on failure. Provider calls time out after 60 seconds;
at most four run concurrently per backend process. Keep the reverse proxy upload
limit at least 6 MiB and its read timeout above 60 seconds.

The frontend no longer uses the Supabase SDK, edge function or legacy database
clients. Existing DGT invoice and inventory endpoints remain authoritative.
Historical Supabase files are recoverable from Git. This code change does not
export remote Supabase data, delete a hosted project, or configure production secrets.

Targeted tests: `mvn -Dtest=ReceiptReaderTest,LotteryReceiptReaderControllerTest test`.
