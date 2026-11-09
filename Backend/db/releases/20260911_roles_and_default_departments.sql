-- User-authorized real dgt release. Company ownership mapping is separate.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
DO $$ BEGIN
 IF current_database() <> 'dgt' THEN RAISE EXCEPTION 'This release is restricted to dgt'; END IF;
END $$;

CREATE TABLE public.companies (
 company_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 company_name varchar(200) NOT NULL CHECK (btrim(company_name) <> ''),
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.stores ADD COLUMN company_id bigint REFERENCES public.companies(company_id);
CREATE INDEX stores_company_idx ON public.stores(company_id);
-- Existing stores stay unassigned. Never infer company ownership from names/users.
CREATE TABLE public.company_admins (
 company_id bigint NOT NULL REFERENCES public.companies(company_id),
 user_id bigint NOT NULL REFERENCES public.users(user_id),
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(company_id,user_id)
);

ALTER TABLE public.permissions ADD COLUMN can_view boolean NOT NULL DEFAULT false;
ALTER TABLE public.permissions ADD COLUMN can_edit boolean NOT NULL DEFAULT false;
-- Preserve active module grants for recognized roles; accountant starts read-only.
-- Unrecognized roles get no new rights. Do not convert Viewer users into cashiers.
UPDATE public.permissions p SET
 can_view = p.is_active AND ur.is_active AND rt.is_active AND m.is_active
   AND upper(btrim(rt.role_type_name)) IN ('ADMIN','MANAGER','CASHIER','ACCOUNTANT'),
 can_edit = p.is_active AND ur.is_active AND rt.is_active AND m.is_active
   AND upper(btrim(rt.role_type_name)) IN ('ADMIN','MANAGER','CASHIER')
FROM public.user_roles ur, public.role_types rt, public.modules m
WHERE p.user_role_id=ur.user_role_id AND ur.role_type_id=rt.role_type_id AND p.module_id=m.module_id;
ALTER TABLE public.permissions ADD CONSTRAINT permissions_edit_requires_view CHECK (NOT can_edit OR can_view);

CREATE TABLE public.module_approval_policies (
 company_id bigint NOT NULL REFERENCES public.companies(company_id),
 module_id bigint NOT NULL REFERENCES public.modules(module_id),
 manager_requires_admin boolean NOT NULL DEFAULT false,
 updated_by bigint REFERENCES public.users(user_id),
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(company_id,module_id)
);
-- Missing manager policy means no extra admin approval until configured.
-- Cashier/edit-enabled accountant approval is mandatory in service logic, not optional here.
CREATE TABLE public.approval_requests (
 request_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 company_id bigint NOT NULL REFERENCES public.companies(company_id),
 dgt_id varchar(50) NOT NULL REFERENCES public.stores(dgt_id),
 module_id bigint NOT NULL REFERENCES public.modules(module_id),
 requested_by bigint NOT NULL REFERENCES public.users(user_id),
 requester_role_id bigint NOT NULL REFERENCES public.user_roles(user_role_id),
 required_approver varchar(20) NOT NULL CHECK(required_approver IN ('MANAGER_OR_ADMIN','ADMIN')),
 operation_code varchar(100) NOT NULL,
 target_id varchar(100),
 expected_versions jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(expected_versions)='object'),
 proposed_values jsonb NOT NULL CHECK(jsonb_typeof(proposed_values)='object'),
 status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','CANCELLED','STALE')),
 reviewed_by bigint REFERENCES public.users(user_id),
 review_note text,
 idempotency_key uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 reviewed_at timestamptz,
 CHECK(reviewed_by IS NULL OR reviewed_by<>requested_by),
 CHECK(status NOT IN ('APPROVED','REJECTED') OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
 UNIQUE(requested_by,idempotency_key)
);
CREATE INDEX approval_requests_queue_idx ON public.approval_requests(company_id,dgt_id,status,created_at);
CREATE TABLE public.access_audit_events (
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 company_id bigint NOT NULL REFERENCES public.companies(company_id),
 dgt_id varchar(50) REFERENCES public.stores(dgt_id),
 actor_user_id bigint NOT NULL REFERENCES public.users(user_id),
 event_type varchar(100) NOT NULL,
 target_type varchar(100) NOT NULL,
 target_id varchar(100),
 changes jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- No company/admin/role assignment seeds: bootstrap requires reviewed mappings.

-- Role/module catalog only; no test accounts or passwords are copied.
INSERT INTO role_types(role_type_name) VALUES ('ADMIN'),('MANAGER'),('CASHIER'),('ACCOUNTANT');
INSERT INTO modules(module_name) VALUES ('STORE_SETTINGS'),('DEPARTMENTS');
CREATE TABLE store_role_permissions (
 dgt_id varchar(50) NOT NULL REFERENCES stores(dgt_id),
 role_type_id bigint NOT NULL REFERENCES role_types(role_type_id),
 permission_code varchar(80) NOT NULL,
 allowed boolean NOT NULL DEFAULT false,
 updated_by bigint REFERENCES users(user_id),
 updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(dgt_id,role_type_id,permission_code),
 CHECK(permission_code IN ('STORE_SETTINGS_VIEW','STORE_SETTINGS_EDIT','DEPARTMENTS_VIEW','DEPARTMENTS_EDIT','GROCERY_VIEW_INVENTORY','GROCERY_ADJUST_STOCK','GROCERY_REDUCE_STOCK','GROCERY_CREATE_PO','GROCERY_APPROVE_PO','GROCERY_RECEIVE_INVENTORY','GROCERY_APPROVE_INVOICE','GROCERY_SETTINGS','LOTTERY_RECEIVE_DELIVERY','LOTTERY_CONFIRM_PACKS','LOTTERY_ACTIVATE_PACKS','LOTTERY_CLOSE_SHIFT','LOTTERY_RETURN_PACKS','LOTTERY_SETTLE_PACKS','LOTTERY_VIEW_REPORTS','LOTTERY_SETTINGS'))
);
-- Preserve only access shared by all active assignments of a role in each store.
-- Missing or conflicting individual grants resolve to denied; admin can choose new role access.
INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed)
SELECT ur.dgt_id,ur.role_type_id,m.module_name || suffix.code,
 bool_and(coalesce(p.is_active AND p.can_view AND (suffix.code='_VIEW' OR p.can_edit),false))
FROM user_roles ur JOIN role_types rt USING(role_type_id)
CROSS JOIN modules m CROSS JOIN (VALUES ('_VIEW'),('_EDIT')) suffix(code)
LEFT JOIN permissions p ON p.user_role_id=ur.user_role_id AND p.module_id=m.module_id
WHERE ur.is_active AND rt.role_type_name IN ('MANAGER','CASHIER','ACCOUNTANT')
 AND m.is_active AND m.module_name IN ('STORE_SETTINGS','DEPARTMENTS')
GROUP BY ur.dgt_id,ur.role_type_id,m.module_name,suffix.code;
INSERT INTO departments(department_name,is_default) SELECT 'Grocery',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Grocery');
INSERT INTO departments(department_name,is_default) SELECT 'Beer, Wine & Spirits',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Beer, Wine & Spirits');
INSERT INTO departments(department_name,is_default) SELECT 'Tobacco & Nicotine',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Tobacco & Nicotine');
INSERT INTO departments(department_name,is_default) SELECT 'Health & Wellness',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Health & Wellness');
INSERT INTO departments(department_name,is_default) SELECT 'Pharmacy',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Pharmacy');
INSERT INTO departments(department_name,is_default) SELECT 'Beauty & Personal Care',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Beauty & Personal Care');
INSERT INTO departments(department_name,is_default) SELECT 'Baby',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Baby');
INSERT INTO departments(department_name,is_default) SELECT 'Household Essentials',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Household Essentials');
INSERT INTO departments(department_name,is_default) SELECT 'Pet Supplies',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Pet Supplies');
INSERT INTO departments(department_name,is_default) SELECT 'Electronics',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Electronics');
INSERT INTO departments(department_name,is_default) SELECT 'Home',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Home');
INSERT INTO departments(department_name,is_default) SELECT 'Clothing & Apparel',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Clothing & Apparel');
INSERT INTO departments(department_name,is_default) SELECT 'Shoes',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Shoes');
INSERT INTO departments(department_name,is_default) SELECT 'Jewelry & Accessories',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Jewelry & Accessories');
INSERT INTO departments(department_name,is_default) SELECT 'Automotive',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Automotive');
INSERT INTO departments(department_name,is_default) SELECT 'Hardware & Home Improvement',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Hardware & Home Improvement');
INSERT INTO departments(department_name,is_default) SELECT 'Lawn & Garden',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Lawn & Garden');
INSERT INTO departments(department_name,is_default) SELECT 'Sports & Outdoors',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Sports & Outdoors');
INSERT INTO departments(department_name,is_default) SELECT 'Toys & Games',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Toys & Games');
INSERT INTO departments(department_name,is_default) SELECT 'Office & School Supplies',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Office & School Supplies');
INSERT INTO departments(department_name,is_default) SELECT 'Books, Movies & Music',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Books, Movies & Music');
INSERT INTO departments(department_name,is_default) SELECT 'Arts, Crafts & Sewing',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Arts, Crafts & Sewing');
INSERT INTO departments(department_name,is_default) SELECT 'Party & Celebrations',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Party & Celebrations');
INSERT INTO departments(department_name,is_default) SELECT 'Seasonal',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Seasonal');
INSERT INTO departments(department_name,is_default) SELECT 'Travel & Luggage',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Travel & Luggage');
INSERT INTO departments(department_name,is_default) SELECT 'Convenience / Front End',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Convenience / Front End');
INSERT INTO departments(department_name,is_default) SELECT 'Lottery',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Lottery');
INSERT INTO departments(department_name,is_default) SELECT 'Fuel',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Fuel');
INSERT INTO departments(department_name,is_default) SELECT 'Gift Cards & Prepaid',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Gift Cards & Prepaid');
INSERT INTO departments(department_name,is_default) SELECT 'Floral',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Floral');
INSERT INTO departments(department_name,is_default) SELECT 'Photo & Printing',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Photo & Printing');
INSERT INTO departments(department_name,is_default) SELECT 'Services',true WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_name='Services');
COMMIT;
