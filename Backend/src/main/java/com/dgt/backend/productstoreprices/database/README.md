# productstoreprices database

Tables: `product_store_prices`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## product_store_prices

```sql
create table product_store_prices (
    id uuid primary key,
    store_id uuid not null references stores(id),
    product_id uuid not null references products(id),
    price numeric(15,2) not null check(price>=0),
    unique(store_id,product_id),
    version bigint not null default 0,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);
```
