# sales database

Tables: `sales`, `sale_lines`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## sales

```sql
create table sales (
    id uuid primary key,
    store_id uuid not null references stores(id),
    idempotency_key varchar(100) not null unique,
    request_hash varchar(64) not null,
    business_date date not null,
    subtotal numeric(15,2) not null check(subtotal>=0),
    tax numeric(15,2) not null check(tax>=0),
    total numeric(15,2) not null check(total>=0),
    payment_method varchar(20) not null check(payment_method in ('CASH','CARD','OTHER')),
    actor varchar(80) not null,
    created_at timestamp with time zone not null default current_timestamp
);
```

## sale_lines

```sql
create table sale_lines (
    id uuid primary key,
    sale_id uuid not null references sales(id),
    product_id uuid not null references products(id),
    quantity numeric(15,3) not null check(quantity>0),
    unit_price numeric(15,2) not null,
    discount_percent numeric(5,2) not null,
    net numeric(15,2) not null,
    tax numeric(15,2) not null
);
```
