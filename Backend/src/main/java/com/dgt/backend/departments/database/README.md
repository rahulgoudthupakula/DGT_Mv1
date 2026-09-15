# departments database

Tables: `departments`, `subdepartments`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## departments

```sql
create table departments (
    id uuid primary key,
    name varchar(160) not null unique,
    active boolean not null,
    version bigint not null default 0,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);
```

## subdepartments

```sql
create table subdepartments (
    id uuid primary key,
    department_id uuid not null references departments(id),
    name varchar(160) not null,
    active boolean not null,
    unique(department_id,name),
    version bigint not null default 0,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);
```
