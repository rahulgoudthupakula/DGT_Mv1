-- Run as the database owner with psql -v runtime_user=dgt_app -f this-file.
-- The login must already exist, have no role memberships, and own no objects.
\set ON_ERROR_STOP on
BEGIN;
SELECT set_config('dgt.runtime_role', :'runtime_user', true);
DO $$
DECLARE r oid;
BEGIN
 SELECT oid INTO STRICT r FROM pg_roles WHERE rolname=current_setting('dgt.runtime_role');
 IF EXISTS(SELECT 1 FROM pg_auth_members WHERE member=r) OR
    EXISTS(SELECT 1 FROM pg_class WHERE relowner=r) OR
    EXISTS(SELECT 1 FROM pg_namespace WHERE nspowner=r) OR
    EXISTS(SELECT 1 FROM pg_database WHERE datdba=r) THEN
  RAISE EXCEPTION 'Runtime role must not own objects or belong to other roles';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef) THEN
  RAISE EXCEPTION 'Review SECURITY DEFINER functions before granting runtime access';
 END IF;
END $$;
ALTER ROLE :"runtime_user" NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM :"runtime_user";
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM :"runtime_user";
GRANT USAGE ON SCHEMA public TO :"runtime_user";
SELECT format('GRANT CONNECT ON DATABASE %I TO %I',current_database(), :'runtime_user') \gexec
SELECT format('GRANT SELECT, INSERT, UPDATE ON TABLE %I.%I TO %I',schemaname,tablename, :'runtime_user')
FROM pg_tables WHERE schemaname='public' AND tablename <> 'flyway_schema_history' \gexec
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO :"runtime_user";
-- Apply again after later migrations create tables. Runtime never runs Flyway.
COMMIT;
