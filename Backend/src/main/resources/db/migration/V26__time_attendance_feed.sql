-- Reuse the time-entry ledger; attach stable connector identities for safe retries.
ALTER TABLE employee_time_entries ADD COLUMN source_system varchar(100),
 ADD COLUMN source_entry_id varchar(150),ADD COLUMN source_employee_code varchar(100),
 ADD COLUMN connector_id uuid REFERENCES pos_connectors(connector_id);
CREATE UNIQUE INDEX employee_time_entries_source_uq ON employee_time_entries(dgt_id,source_system,source_entry_id) WHERE source_entry_id IS NOT NULL;
CREATE INDEX employee_time_entries_store_clock_idx ON employee_time_entries(dgt_id,clock_in);
CREATE TABLE store_attendance_settings (
 dgt_id varchar(50) PRIMARY KEY REFERENCES stores(dgt_id),
 weekly_overtime_hours numeric(6,2) NOT NULL DEFAULT 40 CHECK (weekly_overtime_hours>0 AND weekly_overtime_hours<=168),
 updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_by bigint REFERENCES users(user_id)
);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='dgt_app') THEN GRANT SELECT,INSERT,UPDATE ON store_attendance_settings TO dgt_app; END IF;
END $$;
