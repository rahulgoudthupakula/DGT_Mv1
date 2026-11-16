CREATE TABLE employee_employment_periods (
 employment_period_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 employee_id bigint NOT NULL REFERENCES employees(employee_id),
 dgt_id varchar(50) NOT NULL REFERENCES stores(dgt_id),
 hired_on date NOT NULL,
 ended_on date,
 recorded_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK (ended_on IS NULL OR ended_on >= hired_on)
);
CREATE INDEX ON employee_employment_periods(employee_id,dgt_id,employment_period_id DESC);
-- Preserve the currently known period. Earlier overwritten periods cannot be inferred.
INSERT INTO employee_employment_periods(employee_id,dgt_id,hired_on,ended_on)
 SELECT employee_id,dgt_id,effective_from,effective_to FROM employee_store_assignments;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='dgt_app') THEN
  GRANT SELECT,INSERT,UPDATE ON employee_employment_periods TO dgt_app;
  GRANT USAGE,SELECT ON SEQUENCE employee_employment_periods_employment_period_id_seq TO dgt_app;
 END IF;
END $$;
