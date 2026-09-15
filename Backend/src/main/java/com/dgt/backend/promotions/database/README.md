# promotions database

Tables: `promotions`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## promotions

```sql
create table promotions (
    id uuid primary key,
    store_id uuid not null references stores(id),
    product_id uuid not null references products(id),
    name varchar(160) not null,
    discount_percent numeric(5,2) not null check(discount_percent between 0 and 100),
    starts_on date not null,
    ends_on date not null,
    active boolean not null,
    check(ends_on>=starts_on),
    version bigint not null default 0,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);
```
