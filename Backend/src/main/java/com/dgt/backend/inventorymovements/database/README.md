# inventorymovements database

Tables: `inventory_movements`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## inventory_movements

```sql
create table inventory_movements (
    id uuid primary key,
    store_id uuid not null references stores(id),
    product_id uuid not null references products(id),
    delta numeric(15,3) not null check(delta<>0),
    reason varchar(30) not null,
    reference varchar(100) not null,
    actor varchar(80) not null,
    created_at timestamp with time zone not null default current_timestamp
);
```
