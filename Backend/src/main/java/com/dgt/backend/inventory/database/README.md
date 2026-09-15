# inventory database

Tables: `inventory`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## inventory

```sql
create table inventory (
    store_id uuid not null references stores(id),
    product_id uuid not null references products(id),
    quantity numeric(15,3) not null default 0 check(quantity>=0),
    primary key(store_id,product_id)
);
```
