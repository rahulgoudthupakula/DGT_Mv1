-- Store Account Overview only. Applied to real dgt with user approval. Do not rerun.
-- Existing timezones remain unassigned; existing hours remain SCHEDULED.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
ALTER TABLE public.stores ADD COLUMN timezone varchar(80);
CREATE FUNCTION public.validate_store_timezone() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.timezone IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_timezone_names WHERE name=NEW.timezone
      AND (name='UTC' OR name LIKE '%/%') AND name NOT LIKE 'posix/%' AND name NOT LIKE 'right/%'
  ) THEN
    RAISE EXCEPTION 'Invalid IANA store timezone' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_store_timezone BEFORE INSERT OR UPDATE OF timezone ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.validate_store_timezone();
ALTER TABLE store_business_hours ADD COLUMN status varchar(20) NOT NULL DEFAULT 'SCHEDULED';
ALTER TABLE store_business_hours ALTER COLUMN open_time DROP NOT NULL;
ALTER TABLE store_business_hours ALTER COLUMN close_time DROP NOT NULL;
ALTER TABLE store_business_hours ADD CONSTRAINT chk_business_hours_status CHECK (
 (status='SCHEDULED' AND open_time IS NOT NULL AND close_time IS NOT NULL AND open_time<>close_time)
 OR (status IN ('CLOSED','OPEN_24_HOURS','UNSET') AND open_time IS NULL AND close_time IS NULL)
);
COMMIT;
