# productvendors database

Tables: `product_vendors`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## product_vendors

```sql
create table product_vendors (
    id uuid primary key,
    product_id uuid not null references products(id),
    vendor_id uuid not null references vendors(id),
    vendor_sku varchar(80) not null,
    unit_cost numeric(15,4) not null check(unit_cost>=0),
    unique(product_id,vendor_id),
    version bigint not null default 0,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);
```
