BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$ BEGIN IF current_database()<>'dgt' THEN RAISE EXCEPTION 'Real dgt only'; END IF; END $$;
ALTER TABLE employee_store_assignments ADD COLUMN job_title varchar(100), ADD COLUMN department_id bigint REFERENCES departments(department_id), ADD COLUMN store_department_id bigint REFERENCES store_departments(store_department_id), ADD CONSTRAINT employee_department_one CHECK(department_id IS NULL OR store_department_id IS NULL);
CREATE TABLE employee_deposit_instructions (
 employee_id bigint PRIMARY KEY REFERENCES employees(employee_id) ON DELETE CASCADE,
 bank_name varchar(100) NOT NULL, account_holder varchar(200) NOT NULL,
 account_type varchar(20) NOT NULL CHECK(account_type IN ('Checking','Savings')),
 account_last_four varchar(4) NOT NULL CHECK(account_last_four ~ '^[0-9]{4}$'),
 routing_number varchar(9) NOT NULL CHECK(routing_number ~ '^[0-9]{9}$'),
 active boolean NOT NULL DEFAULT true,
 is_test boolean NOT NULL DEFAULT true CHECK(is_test),
 updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE employee_deductions (
 employee_id bigint NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
 deduction_type varchar(40) NOT NULL,
 calculation_type varchar(20) NOT NULL CHECK(calculation_type IN ('FIXED','PERCENT')),
 amount numeric(12,2) NOT NULL CHECK(amount>=0 AND (calculation_type<>'PERCENT' OR amount<=100)),
 frequency varchar(30) NOT NULL CHECK(frequency='PER_PAY_PERIOD'),
 effective_from date NOT NULL, effective_to date,
 active boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(employee_id,deduction_type),CHECK(effective_to IS NULL OR effective_to>=effective_from)
);
COMMIT;
