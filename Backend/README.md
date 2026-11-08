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
