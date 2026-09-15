# employees database

Tables: `employees`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## employees

```sql
create table employees (
    id uuid primary key,
    store_id uuid not null references stores(id),
    employee_number varchar(40) not null unique,
    name varchar(160) not null,
    hourly_rate numeric(12,2) not null check(hourly_rate>=0),
    active boolean not null,
    version bigint not null default 0,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);
```
