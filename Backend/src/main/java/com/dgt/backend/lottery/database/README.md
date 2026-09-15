# lottery database

Tables: `lottery_games`, `lottery_settlements`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## lottery_games

```sql
create table lottery_games (
    id uuid primary key,
    game_number varchar(40) not null unique,
    name varchar(160) not null,
    ticket_price numeric(12,2) not null check(ticket_price>0),
    active boolean not null,
    version bigint not null default 0,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);
```

## lottery_settlements

```sql
create table lottery_settlements (
    id uuid primary key,
    store_id uuid not null references stores(id),
    game_id uuid not null references lottery_games(id),
    business_date date not null,
    tickets_sold integer not null check(tickets_sold>=0),
    ticket_price numeric(12,2) not null,
    sales_amount numeric(15,2) not null,
    payouts numeric(15,2) not null check(payouts>=0),
    net_amount numeric(15,2) not null,
    actor varchar(80) not null,
    unique(store_id,game_id,business_date)
);
```
