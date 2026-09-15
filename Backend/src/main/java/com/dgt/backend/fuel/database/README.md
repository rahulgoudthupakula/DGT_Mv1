# fuel database

Tables: `fuel_tanks`, `fuel_readings`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## fuel_tanks

```sql
create table fuel_tanks (
    id uuid primary key,
    store_id uuid not null references stores(id),
    name varchar(80) not null,
    grade varchar(40) not null,
    capacity numeric(15,3) not null check(capacity>0),
    unique(store_id,name),
    version bigint not null default 0,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);
```

## fuel_readings

```sql
create table fuel_readings (
    id uuid primary key,
    tank_id uuid not null references fuel_tanks(id),
    business_date date not null,
    opening_volume numeric(15,3) not null check(opening_volume>=0),
    delivered_volume numeric(15,3) not null check(delivered_volume>=0),
    sold_volume numeric(15,3) not null check(sold_volume>=0),
    closing_volume numeric(15,3) not null check(closing_volume>=0),
    variance numeric(15,3) not null,
    actor varchar(80) not null,
    unique(tank_id,business_date)
);
```
