-- Approved real profile release; no sample profile/user/password data copied.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $$ BEGIN IF current_database()<>'dgt' THEN RAISE EXCEPTION 'real dgt only'; END IF; END $$;
CREATE TABLE user_sessions (
 session_id uuid PRIMARY KEY,
 user_id bigint NOT NULL REFERENCES users(user_id),
 token_hash varchar(64) NOT NULL UNIQUE,
 credential_fingerprint varchar(64) NOT NULL,
 ip_address varchar(64) NOT NULL,
 user_agent varchar(512) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 last_active_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz
);
CREATE INDEX user_sessions_user_idx ON user_sessions(user_id);
CREATE TABLE user_login_events (
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id bigint NOT NULL REFERENCES users(user_id),
 occurred_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 ip_address varchar(64) NOT NULL,
 user_agent varchar(512) NOT NULL,
 status varchar(10) NOT NULL CHECK(status IN ('SUCCESS','FAILED'))
);
CREATE INDEX user_login_events_user_time_idx ON user_login_events(user_id,occurred_at DESC);
COMMIT;
