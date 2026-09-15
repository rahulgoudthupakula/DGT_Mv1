# dailyclosing database

Tables: `daily_closings`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## daily_closings

```sql
create table daily_closings (
    id uuid primary key,
    store_id uuid not null references stores(id),
    business_date date not null,
    opening_cash numeric(15,2) not null check(opening_cash>=0),
    cash_sales numeric(15,2) not null,
    cash_paid_out numeric(15,2) not null check(cash_paid_out>=0),
    expected_cash numeric(15,2) not null,
    counted_cash numeric(15,2) not null check(counted_cash>=0),
    variance numeric(15,2) not null,
    actor varchar(80) not null,
    created_at timestamp with time zone not null default current_timestamp,
    unique(store_id,business_date)
);
```
