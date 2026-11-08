BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$ BEGIN IF current_database()<>'dgt' THEN RAISE EXCEPTION 'Real dgt only'; END IF; END $$;
ALTER TABLE employee_schedules ADD COLUMN job_title varchar(100),ADD COLUMN override_reason varchar(500),ADD COLUMN published_at timestamptz;
ALTER TABLE employee_time_off_requests ADD COLUMN dgt_id varchar(50) REFERENCES stores(dgt_id),ADD COLUMN submitted_by bigint REFERENCES users(user_id);
INSERT INTO status_types(status_name) SELECT v FROM (VALUES ('PENDING'),('APPROVED'),('REJECTED'),('CANCELLED')) x(v) WHERE NOT EXISTS(SELECT 1 FROM status_types s WHERE s.status_name=x.v);
CREATE TABLE workforce_requests (
 request_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 dgt_id varchar(50) NOT NULL REFERENCES stores(dgt_id),employee_id bigint NOT NULL REFERENCES employees(employee_id),
 kind varchar(20) NOT NULL CHECK(kind IN ('AVAILABILITY','EXCEPTION','TIME_OFF','COVER','SWAP')),
 status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
 payload jsonb NOT NULL,shift_version text,other_shift_version text,submitted_by bigint NOT NULL REFERENCES users(user_id),request_key uuid NOT NULL,
 leave_id bigint REFERENCES employee_time_off_requests(time_off_request_id),
 accepted_by bigint REFERENCES users(user_id),target_employee_id bigint REFERENCES employees(employee_id),
 reviewed_by bigint REFERENCES users(user_id),review_note varchar(500),created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(submitted_by,request_key)
);
CREATE TABLE workforce_availability (
 availability_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 dgt_id varchar(50) NOT NULL REFERENCES stores(dgt_id),employee_id bigint NOT NULL REFERENCES employees(employee_id),
 kind varchar(20) NOT NULL CHECK(kind IN ('AVAILABILITY','EXCEPTION')),start_date date NOT NULL,end_date date,
 weekday integer CHECK(weekday BETWEEN 1 AND 7),start_time time,end_time time,overnight boolean NOT NULL,unavailable boolean NOT NULL,
 request_id bigint NOT NULL UNIQUE REFERENCES workforce_requests(request_id),
 CHECK(end_date IS NULL OR end_date>=start_date)
);
CREATE TABLE workforce_leave_shifts (
 request_id bigint NOT NULL REFERENCES workforce_requests(request_id),schedule_id bigint NOT NULL REFERENCES employee_schedules(schedule_id),
 employee_id bigint NOT NULL REFERENCES employees(employee_id),work_date date NOT NULL,start_at timestamptz NOT NULL,end_at timestamptz NOT NULL,
 PRIMARY KEY(request_id,schedule_id)
);
CREATE INDEX workforce_requests_store ON workforce_requests(dgt_id,employee_id);
CREATE INDEX workforce_availability_employee ON workforce_availability(employee_id,dgt_id,start_date);
CREATE INDEX workforce_shift_employee_time ON employee_schedules(employee_id,schedule_start,schedule_end);
COMMIT;
