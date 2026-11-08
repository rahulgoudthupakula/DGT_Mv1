BEGIN;
SET LOCAL lock_timeout='5s';
DO $$ BEGIN IF current_database()<>'dgt' THEN RAISE EXCEPTION 'Real dgt only'; END IF; END $$;
LOCK TABLE employees,employee_store_assignments,employee_compensation IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO employees(user_id,hire_date,employee_type)
SELECT DISTINCT u.user_id,DATE '2026-01-01','Full-time'
FROM users u JOIN user_roles ur USING(user_id)
WHERE ur.dgt_id IN ('DGT-1017','DGT-1018') AND ur.is_active
AND NOT EXISTS(SELECT 1 FROM employees e WHERE e.user_id=u.user_id);
INSERT INTO employee_store_assignments(employee_id,dgt_id,is_primary,effective_from,role_type_id)
SELECT e.employee_id,ur.dgt_id,ur.dgt_id=u.dgt_id,DATE '2026-01-01',ur.role_type_id
FROM employees e JOIN users u ON u.user_id=e.user_id JOIN user_roles ur ON ur.user_id=u.user_id
WHERE ur.dgt_id IN ('DGT-1017','DGT-1018') AND ur.is_active
AND NOT EXISTS(SELECT 1 FROM employee_store_assignments s WHERE s.employee_id=e.employee_id AND s.dgt_id=ur.dgt_id);
INSERT INTO employee_compensation(employee_id,pay_type,hourly_rate,effective_from)
SELECT e.employee_id,'Hourly',CASE WHEN EXISTS(SELECT 1 FROM user_roles ur JOIN role_types rt USING(role_type_id) WHERE ur.user_id=e.user_id AND ur.is_active AND rt.role_type_name='MANAGER' AND ur.dgt_id IN ('DGT-1017','DGT-1018')) THEN 25 ELSE 18 END,DATE '2026-01-01'
FROM employees e WHERE EXISTS(SELECT 1 FROM employee_store_assignments s WHERE s.employee_id=e.employee_id AND s.dgt_id IN ('DGT-1017','DGT-1018'))
AND NOT EXISTS(SELECT 1 FROM employee_compensation c WHERE c.employee_id=e.employee_id);

INSERT INTO employees(user_id,hire_date,employee_type)
SELECT DISTINCT ca.user_id,DATE '2026-01-01','Full-time'
FROM company_admins ca JOIN stores s ON s.company_id=ca.company_id
WHERE ca.is_active AND s.dgt_id IN ('DGT-1017','DGT-1018')
AND NOT EXISTS(SELECT 1 FROM employees e WHERE e.user_id=ca.user_id);
INSERT INTO employee_store_assignments(employee_id,dgt_id,is_primary,effective_from,role_type_id)
SELECT e.employee_id,s.dgt_id,s.dgt_id=u.dgt_id,DATE '2026-01-01',rt.role_type_id
FROM company_admins ca JOIN stores s ON s.company_id=ca.company_id
JOIN employees e ON e.user_id=ca.user_id JOIN users u ON u.user_id=ca.user_id
CROSS JOIN role_types rt
WHERE ca.is_active AND s.dgt_id IN ('DGT-1017','DGT-1018') AND rt.role_type_name='ADMIN'
AND NOT EXISTS(SELECT 1 FROM employee_store_assignments esa WHERE esa.employee_id=e.employee_id AND esa.dgt_id=s.dgt_id);
INSERT INTO employee_compensation(employee_id,pay_type,hourly_rate,effective_from)
SELECT e.employee_id,'Hourly',30,DATE '2026-01-01' FROM employees e
WHERE EXISTS(SELECT 1 FROM company_admins ca JOIN stores s ON s.company_id=ca.company_id WHERE ca.user_id=e.user_id AND ca.is_active AND s.dgt_id IN ('DGT-1017','DGT-1018'))
AND NOT EXISTS(SELECT 1 FROM employee_compensation c WHERE c.employee_id=e.employee_id);
COMMIT;
