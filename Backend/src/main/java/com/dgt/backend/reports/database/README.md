# reports database

Tables: Read-only projections of sales, products, inventory and store prices.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

Report entities are read-only projections: daily sales by tender and inventory retail valuation. No report table is needed.
