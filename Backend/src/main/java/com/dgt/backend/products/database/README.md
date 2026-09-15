# products database

Tables: `products`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## products

```sql
create table products (
    id uuid primary key,
    sku varchar(80) not null unique,
    name varchar(200) not null,
    subdepartment_id uuid not null references subdepartments(id),
    unit varchar(20) not null,
    tax_rate numeric(7,4) not null check(tax_rate between 0 and 1),
    active boolean not null,
    version bigint not null default 0,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);
```
