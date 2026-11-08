-- Approved department-only migration. Existing subdepartments retain unknown origin.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
-- Custom departments belong to a store and do not create/change global defaults.
ALTER TABLE public.store_departments ALTER COLUMN department_id DROP NOT NULL;
ALTER TABLE public.store_departments ALTER COLUMN source_type SET DEFAULT 'CUSTOM';
ALTER TABLE public.store_departments ADD CONSTRAINT store_department_source_check
  CHECK ((source_type = 'DEFAULT' AND department_id IS NOT NULL)
      OR (source_type = 'CUSTOM' AND department_id IS NULL));
-- Existing CUSTOM rows linked to a global department require owner review before
-- validation. The application blocks edits to these legacy linked custom rows.

-- Existing subdepartments cannot safely be guessed to be default or custom.
ALTER TABLE public.store_sub_departments ADD COLUMN source_type varchar(20) NOT NULL DEFAULT 'UNCLASSIFIED';
ALTER TABLE public.store_sub_departments ALTER COLUMN source_type SET DEFAULT 'CUSTOM';
ALTER TABLE public.store_sub_departments ADD CONSTRAINT store_sub_department_source_check
  CHECK (source_type IN ('DEFAULT','CUSTOM','UNCLASSIFIED'));

COMMIT;
