# identity database

Tables: `permissions`, `roles`, `role_permissions`, `app_users`, `user_roles`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql` and permission seeds are in `V2__permissions.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## permissions

```sql
create table permissions (
    code varchar(80) primary key
);
```

## roles

```sql
create table roles (
    id uuid primary key,
    name varchar(80) not null unique
);
```

## role_permissions

```sql
create table role_permissions (
    role_id uuid not null references roles(id),
    permission_code varchar(80) not null references permissions(code),
    primary key(role_id,permission_code)
);
```

## app_users

```sql
create table app_users (
    id uuid primary key,
    username varchar(80) not null unique,
    password_hash varchar(100) not null,
    enabled boolean not null default true
);
```

## user_roles

```sql
create table user_roles (
    user_id uuid not null references app_users(id),
    role_id uuid not null references roles(id),
    primary key(user_id,role_id)
);
```
