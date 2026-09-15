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
