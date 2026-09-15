# payroll database

Tables: `payroll_entries`.

The authoritative schema is `src/main/resources/db/migration/V1__schema.sql`. Existing migrations stay unchanged to preserve Flyway checksums. Add future schema changes as new migrations. SQL constants in this folder are executed only by repositories.

## payroll_entries

```sql
create table payroll_entries (
    id uuid primary key,
    employee_id uuid not null references employees(id),
    starts_on date not null,
    ends_on date not null,
    regular_hours numeric(8,2) not null check(regular_hours>=0),
    overtime_hours numeric(8,2) not null check(overtime_hours>=0),
    hourly_rate numeric(12,2) not null,
    overtime_multiplier numeric(5,2) not null check(overtime_multiplier>=1),
    gross_pay numeric(15,2) not null,
    deductions numeric(15,2) not null check(deductions>=0),
    net_pay numeric(15,2) not null check(net_pay>=0),
    actor varchar(80) not null,
    check(ends_on>=starts_on),
    unique(employee_id,starts_on,ends_on)
);
```
