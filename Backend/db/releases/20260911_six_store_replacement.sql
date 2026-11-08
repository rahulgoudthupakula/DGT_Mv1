-- Explicitly approved replacement of all ten old stores; preserves admin credentials.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $$ BEGIN IF current_database()<>'dgt' THEN RAISE EXCEPTION 'Real dgt only'; END IF; END $$;
LOCK TABLE stores,users,companies,store_contact_info,store_business_hours IN ACCESS EXCLUSIVE MODE;
DO $$ DECLARE t record; n bigint; BEGIN
 IF (SELECT count(*) FROM stores)<>10 OR (SELECT count(*) FROM users)<>1 OR NOT EXISTS(SELECT 1 FROM users WHERE email='admin@dgt.test' AND dgt_id='DGT-1016') THEN RAISE EXCEPTION 'Store/user snapshot changed; review before retrying'; END IF;
 IF (SELECT count(*) FROM store_contact_info)<>1 OR (SELECT count(*) FROM store_business_hours)<>4 THEN RAISE EXCEPTION 'Linked contact/hour snapshot changed'; END IF;
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('stores','users','store_contact_info','store_business_hours','departments','modules','role_types') LOOP
  EXECUTE format('SELECT count(*) FROM public.%I',t.tablename) INTO n;
  IF n<>0 THEN RAISE EXCEPTION 'Unexpected populated table %; review linked data before deletion',t.tablename; END IF;
 END LOOP;
END $$;
CREATE TEMP TABLE old_stores ON COMMIT DROP AS SELECT dgt_id FROM stores;
CREATE TEMP TABLE preserved_admin ON COMMIT DROP AS SELECT user_id,password_hash,email FROM users WHERE email='admin@dgt.test';
-- Records which store is the company's main location, while store access uses company_id.
ALTER TABLE companies ADD COLUMN primary_store_dgt_id varchar(50);
ALTER TABLE stores ADD CONSTRAINT stores_company_dgt_unique UNIQUE(company_id,dgt_id);
ALTER TABLE companies ADD CONSTRAINT companies_primary_store_fk FOREIGN KEY(company_id,primary_store_dgt_id) REFERENCES stores(company_id,dgt_id);
INSERT INTO companies(company_name) VALUES ('Store 1 Retail Company'),('Store 3 Retail Company');
CREATE TEMP TABLE new_stores(number integer PRIMARY KEY,dgt_id varchar(50)) ON COMMIT DROP;
DO $$ DECLARE i integer; cid bigint; sid varchar(50); zone text; BEGIN
 FOR i IN 1..6 LOOP
  SELECT company_id INTO cid FROM companies WHERE company_name=CASE WHEN i<=2 THEN 'Store 1 Retail Company' ELSE 'Store 3 Retail Company' END;
  zone:=(ARRAY['America/New_York','America/Chicago','America/Los_Angeles','America/Denver','America/Phoenix','Pacific/Honolulu'])[i];
  INSERT INTO stores(store_id,store_name,legal_business_name,tax_id,license_number,timezone,company_id)
  VALUES ('REPLACEMENT-STORE-00'||i,'Store '||i,'Sample Store '||i||' Retail LLC','SAMPLE-TAX-00'||i,'SAMPLE-LIC-00'||i,zone,cid) RETURNING dgt_id INTO sid;
  INSERT INTO new_stores VALUES(i,sid);
  INSERT INTO store_contact_info(dgt_id,store_name,address,phone_number,email)
  VALUES(sid,'Store '||i,'Sample address — '||(100+i)||' Example Lane, '||(ARRAY['New York, NY','Chicago, IL','Los Angeles, CA','Denver, CO','Phoenix, AZ','Honolulu, HI'])[i],'+1-202-555-010'||i,'store'||i||'@example.com');
  INSERT INTO store_business_hours(dgt_id,day_of_week,status,open_time,close_time)
  SELECT sid,day,CASE WHEN day='SUNDAY' THEN 'CLOSED' ELSE 'SCHEDULED' END,
   CASE WHEN day='SUNDAY' THEN NULL::time ELSE '08:00'::time END,
   CASE WHEN day='SUNDAY' THEN NULL::time ELSE '20:00'::time END
  FROM unnest(ARRAY['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']) AS day;
 END LOOP;
END $$;
UPDATE companies SET primary_store_dgt_id=(SELECT dgt_id FROM new_stores WHERE number=CASE WHEN company_name='Store 1 Retail Company' THEN 1 ELSE 3 END);
UPDATE users SET dgt_id=(SELECT dgt_id FROM new_stores WHERE number=1),updated_at=CURRENT_TIMESTAMP WHERE user_id=(SELECT user_id FROM preserved_admin);
INSERT INTO company_admins(company_id,user_id) SELECT company_id,(SELECT user_id FROM preserved_admin) FROM companies;
DELETE FROM store_contact_info WHERE dgt_id IN (SELECT dgt_id FROM old_stores);
DELETE FROM store_business_hours WHERE dgt_id IN (SELECT dgt_id FROM old_stores);
DELETE FROM stores WHERE dgt_id IN (SELECT dgt_id FROM old_stores);
UPDATE stores s SET store_id='STORE-00'||n.number FROM new_stores n WHERE s.dgt_id=n.dgt_id;
-- Conservative initial role preferences; admins can edit each store's matrix.
INSERT INTO store_role_permissions(dgt_id,role_type_id,permission_code,allowed,updated_by)
SELECT n.dgt_id,r.role_type_id,code,
 (r.role_type_name='MANAGER' OR code LIKE '%_VIEW'),(SELECT user_id FROM preserved_admin)
FROM new_stores n CROSS JOIN role_types r CROSS JOIN unnest(ARRAY['STORE_SETTINGS_VIEW','STORE_SETTINGS_EDIT','DEPARTMENTS_VIEW','DEPARTMENTS_EDIT']) AS code
WHERE r.role_type_name IN ('MANAGER','CASHIER','ACCOUNTANT');
INSERT INTO access_audit_events(company_id,dgt_id,actor_user_id,event_type,target_type,target_id,changes)
SELECT s.company_id,s.dgt_id,(SELECT user_id FROM preserved_admin),'STORE_SETUP','STORE',s.dgt_id,
 jsonb_build_object('sampleData',true,'storeName',s.store_name,'companyId',s.company_id,'primaryStore',c.primary_store_dgt_id,'initialPermissions','manager view/edit, cashier and accountant view only')
FROM stores s JOIN companies c USING(company_id);
DO $$ BEGIN
 IF (SELECT count(*) FROM stores)<>6 OR (SELECT count(*) FROM companies)<>2 OR (SELECT count(*) FROM store_contact_info)<>6 OR (SELECT count(*) FROM store_business_hours)<>42 THEN RAISE EXCEPTION 'Replacement counts failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM users u JOIN preserved_admin p USING(user_id) WHERE u.email=p.email AND u.password_hash=p.password_hash) THEN RAISE EXCEPTION 'Admin credentials changed'; END IF;
END $$;
SELECT s.dgt_id,s.store_id,s.store_name,c.company_name,c.primary_store_dgt_id,s.timezone FROM stores s JOIN companies c USING(company_id) ORDER BY s.store_id;
COMMIT;
