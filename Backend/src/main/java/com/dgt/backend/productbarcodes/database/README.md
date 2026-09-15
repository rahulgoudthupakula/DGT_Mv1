# productbarcodes database

Tables: `product_barcodes`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## product_barcodes

```sql
create table product_barcodes (
    id uuid primary key,
    product_id uuid not null references products(id),
    barcode varchar(80) not null unique,
    units_per_scan numeric(15,3) not null check(units_per_scan>0),
    version bigint not null default 0,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);
```
