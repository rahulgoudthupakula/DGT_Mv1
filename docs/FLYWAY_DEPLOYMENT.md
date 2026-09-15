# Flyway deployment setup

Prepared 2026-09-14. Local production `dgt` was explicitly enrolled at Flyway version 1 after user approval, backup and restore verification. Existing `dgt_test` remains unenrolled because of the documented schema drift. AWS deployment has not started.

## What is included

- Spring Boot Flyway starter and PostgreSQL support, using the version managed by the Spring Boot 4.1.1 BOM (Flyway 12.4.0).
- `Backend/src/main/resources/db/migration/V1__production_baseline.sql`: cumulative PostgreSQL 17 production schema: 116 application tables, 5 functions and 4 triggers, including indexes, constraints and sequences.
- Shared catalogs: departments, discount types, roles, modules, status types, subscription plans and billing add-ons. Empty fuel-grade/tender catalogs remain empty. No users, passwords, stores, sales, inventory balances or test samples.
- `FLYWAY_ENABLED=false` by default during adoption. SQL initialization remains disabled. Automatic baselining and Flyway clean are disabled; migrations validate before applying.
- Maven Flyway plugin for explicit `info`, `validate`, `baseline` and `migrate` operations. The Maven plugin runs independently of the application's FLYWAY_ENABLED switch.

Historical scripts under `Backend/db/proposals`, `db/releases`, `db/seeds` and the old 77-table schema snapshot are not executed by Flyway. They overlap and must not be replayed as a migration chain.

## New empty database

Provision PostgreSQL 17 (for AWS, a PostgreSQL database such as RDS; S3 is for backup files). Supply credentials through your secret manager or shell environment, not committed YAML or command-line passwords. The database owner must be able to create objects in public.

From the repository root, with DB_URL, DB_USERNAME and DB_PASSWORD set to the **new** target:

```sh
export FLYWAY_URL="$DB_URL"
export FLYWAY_USER="$DB_USERNAME"
export FLYWAY_PASSWORD="$DB_PASSWORD"
mvn -f Backend/pom.xml flyway:info
mvn -f Backend/pom.xml flyway:migrate
mvn -f Backend/pom.xml flyway:validate
mvn -f Backend/pom.xml -DskipTests clean package
export FLYWAY_ENABLED=true
java -jar Backend/target/dgt-backend-0.1.0-SNAPSHOT.jar
```

Alternatively, the application with FLYWAY_ENABLED=true runs migrations at startup. Pick one controlled migration runner during deployment. If runtime uses a restricted database account, run migrations separately with an owner account and leave runtime Flyway disabled.

A fresh migration creates 117 tables: 116 application tables plus flyway_schema_history. It does **not** create a login/company/store. Initial account provisioning or transferring existing business data is a separate deployment step. Migrations transfer schema changes, not database contents.

## Existing production database: explicit adoption

Do not execute baseline against an arbitrary database merely to suppress a migration error. Baseline records a version; it does not inspect or repair the schema.

1. Take and verify a full backup, identify the exact host/database, and pause schema edits.
2. Compare the target schema with V1, including constraints, triggers, indexes and functions. Review any drift.
3. Obtain approval for the concrete target and adoption. Local production dgt completed this step on 2026-09-14; any different target needs its own verification.
4. Set the same FLYWAY_URL/USER/PASSWORD variables to the reviewed target and run:

```sh
mvn -f Backend/pom.xml flyway:info
mvn -f Backend/pom.xml -Dflyway.baselineVersion=1 flyway:baseline
mvn -f Backend/pom.xml flyway:migrate
mvn -f Backend/pom.xml flyway:validate
```

Baseline marks existing objects as version 1, preserving their data and skipping V1, including its reference inserts. Future V2+ migrations will apply normally. Keep the backup; never use Flyway clean on a business database.

For an AWS move, a full restore of a reviewed existing database followed by baseline is an alternative to an empty V1 installation. Do not apply V1 and then restore another full schema on top of it. Data-only imports must avoid duplicating seeded catalogs and preserve IDs/sequence values.

## Current test/production drift

Both have 116 application tables. Test additionally has:

- inventory_returns.handed_over_date
- inventory_shrinkage.reduction_request_id, its unique index and foreign key
- Two constraints marked NOT VALID that are validated in production: store_business_hours.chk_business_hours_status and store_departments.store_department_source_check.

There are also column-order, comment and equivalent check-expression rendering differences. V1 uses production as its source. Existing test must not be blindly baselined as an exact V1 schema; reconcile these differences under a separately approved migration plan, or validate future work in a fresh V1 database. No extra columns have been deleted or introduced into either existing database.

## Future changes

Create V2__description.sql, then V3, and so on. Include schema and required reference-data changes in migrations in the same code release. Test each on a fresh database and an upgraded copy. Never edit an applied migration: Flyway detects checksum changes. Correct errors with a new migration; do not use repair to conceal an unreviewed difference. Keep sample data outside the production migration directory.

## Provenance and validation

Source: read-only schema dump from local production dgt, PostgreSQL 17.11, 2026-09-14, with no ownership or grants. Dump SHA-256: `e75d86478e5c3cb2f264124f358fde356e85ea9a468c45f530ab209024b8088d`.

The JDBC migration removes psql-only restrict commands and uses transaction-local dump settings. It retains schema object definitions and shared catalog IDs. Sequence positions for seeded catalogs are restored.

Validation uses an isolated PostgreSQL container on port 55441, never the existing test/production databases. Validated successfully:

- Maven clean package and full backend startup with Flyway enabled; schema verifiers passed.
- Fresh V1 migration: 116 application tables plus history, 5 discount types, no users.
- Schema dump matches production after normalizing equivalent PostgreSQL varchar-array casts (zero remaining differences).
- Repeat migration and checksum validation passed.
- Nonempty unbaselined database rejected.
- Explicit baseline on a disposable production-schema clone preserved its fixture data and skipped V1.
- Deliberately modified migration rejected by checksum validation; original validated again.
- Existing 65-test ScopedAccessIntegrationTest suite passed with Flyway disabled.

During preparation, neither existing database was altered. During the subsequently approved local production adoption, only flyway_schema_history was added. Production services still run the previously released JAR; runtime Flyway remains disabled. Future releases can use the configured Maven migration runner before application startup.

Official references: [Spring Boot database initialization](https://docs.spring.io/spring-boot/how-to/data-initialization.html), [Flyway baseline](https://documentation.red-gate.com/flyway/reference/commands/baseline).

## Local production adoption — 2026-09-14

- Target: Docker dgt-postgres, localhost:5432, database dgt.
- Full pre-adoption backup: Backend/backups/flyway-adoption-20260914/dgt-before-flyway.dump, with SHA256SUMS. Backups are excluded from Git; keep them private.
- Backup restored successfully into production_restore_check in the separate validation container.
- Production schema rechecked against V1 before adoption; no drift.
- Flyway info → explicit baseline version 1 → migrate → validate succeeded. History records 1 / BASELINE / successful. V1 schema/catalog inserts were skipped.
- All 116 application-table row counts and the schema dump are unchanged after adoption. The only new table is flyway_schema_history (117 total).
- Existing test database and running production application were not redeployed or modified. No AWS resources were created.
