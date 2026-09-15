# stores database

Tables: `stores`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## stores

```sql
create table stores (
    id uuid primary key,
    code varchar(40) not null unique,
    name varchar(160) not null,
    address varchar(500) not null,
    timezone varchar(80) not null,
    active boolean not null,
    version bigint not null default 0,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);
```
