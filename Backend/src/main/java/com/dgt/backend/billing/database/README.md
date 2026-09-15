# billing database

Tables: `subscription_plans`, `subscriptions`, `billing_invoices`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## subscription_plans

```sql
create table subscription_plans (
    id uuid primary key,
    name varchar(80) not null unique,
    monthly_price numeric(12,2) not null check(monthly_price>=0),
    active boolean not null,
    version bigint not null default 0,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);
```

## subscriptions

```sql
create table subscriptions (
    id uuid primary key,
    store_id uuid not null references stores(id),
    plan_id uuid not null references subscription_plans(id),
    starts_on date not null,
    ends_on date not null,
    status varchar(20) not null check(status in ('ACTIVE','CANCELLED','EXPIRED')),
    check(ends_on>=starts_on),
    version bigint not null default 0,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);
```

## billing_invoices

```sql
create table billing_invoices (
    id uuid primary key,
    subscription_id uuid not null references subscriptions(id),
    period_start date not null,
    period_end date not null,
    amount numeric(12,2) not null check(amount>=0),
    status varchar(20) not null default 'DRAFT' check(status in ('DRAFT','PAID')),
    external_reference varchar(100),
    paid_at timestamp with time zone,
    unique(subscription_id,period_start,period_end),
    check(period_end>=period_start)
);
```
