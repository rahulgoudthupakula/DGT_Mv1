# vendors database

Tables: `vendors`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## vendors

```sql
create table vendors (
    id uuid primary key,
    name varchar(160) not null,
    email varchar(254),
    phone varchar(40),
    active boolean not null,
    version bigint not null default 0,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);
```
