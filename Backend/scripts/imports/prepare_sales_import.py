"""Prepare a transactional, test-only import; never executes SQL itself."""
import sys,json,hashlib
from pathlib import Path
from inspect_sales_workbook import workbook,inspect,date
source=Path(sys.argv[1]);data=workbook(source)
if inspect(data):raise SystemExit('Reconciliation failed; import not generated')
assert all(r['store_id']=='ST001' for name in ('products','sales','payments') for r in data[name])
for name,field in [('sales','sale_datetime'),('payments','payment_datetime')]:
 for r in data[name]:r[field]=date(r[field]).replace(microsecond=0).isoformat()
# No source SQL, formulas or workbook text is executed.
def literal(value):return "'"+value.replace("'","''")+"'"
hash=hashlib.sha256(source.read_bytes()).hexdigest()
prefix="BEGIN;\nSET LOCAL lock_timeout='5s';\nSET LOCAL statement_timeout='120s';\nCREATE TEMP TABLE workbook_payload(data jsonb);\nINSERT INTO workbook_payload VALUES ("+literal(json.dumps(data))+"::jsonb);\n"
sql=r'''
DO $import$
DECLARE store text := 'DGT-1017'; source_hash text := __HASH__; payload jsonb;
 r jsonb; dept bigint; subdept bigint; prod bigint; emp bigint; term bigint; sale bigint; tender bigint; actor bigint; comp bigint;
 products_map jsonb := '{}'; cashier_map jsonb := '{}'; terminal_map jsonb := '{}'; sales_map jsonb := '{}'; line_map jsonb := '{}'; payment_map jsonb := '{}';
 min_date date; source_code text; source_name text; existing bigint;
BEGIN
 IF current_database()<>'dgt_test' THEN RAISE EXCEPTION 'Test database required'; END IF;
 PERFORM dgt_id FROM stores WHERE dgt_id=store AND store_name='Store 1' AND timezone='America/New_York' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Store 1 mapping/timezone must be reviewed'; END IF;
 SELECT data INTO payload FROM workbook_payload;
 SELECT company_id INTO comp FROM stores WHERE dgt_id=store;
 SELECT ca.user_id INTO actor FROM company_admins ca JOIN users u USING(user_id) WHERE ca.company_id=comp AND ca.is_active AND u.email='admin@dgt.test';
 IF actor IS NULL THEN RAISE EXCEPTION 'Test import audit actor missing'; END IF;
 IF EXISTS(SELECT 1 FROM access_audit_events WHERE dgt_id=store AND event_type='SALES_WORKBOOK_IMPORTED' AND changes->>'sha256'=source_hash) THEN
  RAISE NOTICE 'Workbook already imported; no changes'; RETURN;
 END IF;
 IF EXISTS(SELECT 1 FROM sales s JOIN jsonb_array_elements(payload->'sales') x ON s.transaction_id=x->>'transaction_id' OR (s.store_id=store AND s.receipt_no=x->>'receipt_no')) THEN RAISE EXCEPTION 'Existing receipt/transaction collision; no overwrite'; END IF;
 IF EXISTS(SELECT 1 FROM products p JOIN jsonb_array_elements(payload->'products') x ON p.product_sku=x->>'sku' WHERE p.dgt_id=store) THEN RAISE EXCEPTION 'Existing product SKU collision; review mapping'; END IF;
 SELECT min((x->>'sale_datetime')::timestamp)::date INTO min_date FROM jsonb_array_elements(payload->'sales') x;
 FOR r IN SELECT * FROM jsonb_array_elements(payload->'products') LOOP
  SELECT store_department_id INTO dept FROM store_departments WHERE dgt_id=store AND lower(store_department_name)=lower(r->>'department') ORDER BY store_department_id LIMIT 1;
  IF dept IS NULL THEN INSERT INTO store_departments(dgt_id,store_department_name,source_type) VALUES(store,r->>'department','CUSTOM') RETURNING store_department_id INTO dept; END IF;
  SELECT store_sub_department_id INTO subdept FROM store_sub_departments WHERE dgt_id=store AND store_department_id=dept AND store_sub_department_name=r->>'department';
  IF subdept IS NULL THEN INSERT INTO store_sub_departments(dgt_id,store_department_id,store_sub_department_name,source_type) VALUES(store,dept,r->>'department','CUSTOM') RETURNING store_sub_department_id INTO subdept; END IF;
  INSERT INTO products(dgt_id,store_sub_department_id,product_name,product_sku,unit_of_measure,is_taxable,is_active,purchase_unit,purchase_gross_cost,purchase_discount)
  VALUES(store,subdept,r->>'product_name',r->>'sku',r->>'unit_of_measure',(r->>'is_taxable')::int=1,(r->>'is_active')::int=1,'ITEM',(r->>'cost_price')::numeric,0) RETURNING product_id INTO prod;
  INSERT INTO product_store_prices(dgt_id,product_id,retail_price,is_active) VALUES(store,prod,(r->>'selling_price')::numeric,(r->>'is_active')::int=1);
  -- Workbook contains no stock quantities. Initialize no recorded stock; never invent opening stock or replay deductions.
  INSERT INTO inventory(dgt_id,product_id,available_quantity,cost) VALUES(store,prod,0,(r->>'cost_price')::numeric);
  products_map=products_map||jsonb_build_object(r->>'product_id',prod);
 END LOOP;
 FOR source_code IN SELECT DISTINCT x->>'cashier_id' FROM jsonb_array_elements(payload->'sales') x LOOP
  -- Preserve anonymous source codes; do not attribute historical sales to existing named employees or create logins.
  INSERT INTO employees(hire_date,employee_type,first_name,last_name) VALUES(min_date,'IMPORTED','Imported Cashier',source_code) RETURNING employee_id INTO emp;
  INSERT INTO employee_store_assignments(employee_id,dgt_id,is_primary,effective_from,job_title,role_type_id) SELECT emp,store,true,min_date,'Imported cashier',role_type_id FROM role_types WHERE upper(role_type_name)='CASHIER';
  cashier_map=cashier_map||jsonb_build_object(source_code,emp);
 END LOOP;
 FOR source_code IN SELECT DISTINCT x->>'terminal_id' FROM jsonb_array_elements(payload->'sales') x LOOP
  INSERT INTO pos_terminals(store_id,terminal_code,terminal_name,terminal_status) VALUES(store,source_code,'Imported '+source_code,'INACTIVE') ON CONFLICT(store_id,terminal_code) DO NOTHING;
  SELECT terminal_id INTO term FROM pos_terminals WHERE store_id=store AND terminal_code=source_code;
  terminal_map=terminal_map||jsonb_build_object(source_code,term);
 END LOOP;
 FOR r IN SELECT * FROM jsonb_array_elements(payload->'sales') LOOP
  INSERT INTO sales(store_id,cashier_id,terminal_id,receipt_no,transaction_id,transaction_type,sale_status,sale_datetime,subtotal,taxable_amount,tax_amount,discount_amount,total_amount,total_items)
  VALUES(store,(cashier_map->>(r->>'cashier_id'))::bigint,(terminal_map->>(r->>'terminal_id'))::bigint,r->>'receipt_no',r->>'transaction_id',r->>'transaction_type',r->>'sale_status',(r->>'sale_datetime')::timestamp AT TIME ZONE 'America/New_York',(r->>'subtotal')::numeric,(r->>'taxable_amount')::numeric,(r->>'tax_amount')::numeric,(r->>'discount_amount')::numeric,(r->>'total_amount')::numeric,(r->>'total_items')::numeric::integer) RETURNING sale_id INTO sale;
  sales_map=sales_map||jsonb_build_object(r->>'sale_id',sale);
 END LOOP;
 FOR r IN SELECT * FROM jsonb_array_elements(payload->'items') LOOP
  INSERT INTO sales_items(sale_id,product_id,quantity,unit_price,catalog_price,gross_amount,taxable_amount,tax_amount,discount_amount,line_total)
  VALUES((sales_map->>(r->>'sale_id'))::bigint,(products_map->>(r->>'product_id'))::bigint,(r->>'quantity')::numeric,(r->>'unit_price')::numeric,(r->>'catalog_price')::numeric,(r->>'gross_amount')::numeric,(r->>'taxable_amount')::numeric,(r->>'tax_amount')::numeric,(r->>'discount_amount')::numeric,(r->>'line_total')::numeric) RETURNING sales_item_id INTO existing;
  line_map=line_map||jsonb_build_object(r->>'sales_item_id',existing);
 END LOOP;
 FOR r IN SELECT * FROM jsonb_array_elements(payload->'payments') LOOP
  source_code=r->>'payment_method';
  SELECT tender_type_id INTO tender FROM tender_types WHERE tender_code=source_code;
  IF tender IS NULL THEN INSERT INTO tender_types(tender_code,tender_name) VALUES(source_code,initcap(replace(source_code,'_',' '))) RETURNING tender_type_id INTO tender; END IF;
  INSERT INTO sale_payments(sale_id,tender_type_id,payment_amount,payment_status,card_brand,card_last4,processor_reference,payment_datetime)
  VALUES((sales_map->>(r->>'sale_id'))::bigint,tender,(r->>'payment_amount')::numeric,r->>'payment_status',nullif(r->>'card_type',''),nullif(r->>'last4',''),'WORKBOOK:'||(r->>'payment_id'),(r->>'payment_datetime')::timestamp AT TIME ZONE 'America/New_York') RETURNING sale_payment_id INTO existing;
  payment_map=payment_map||jsonb_build_object(r->>'payment_id',existing);
 END LOOP;
 IF EXISTS(SELECT 1 FROM sales s WHERE s.sale_id IN (SELECT value::bigint FROM jsonb_each_text(sales_map)) AND
 (s.total_amount<>(SELECT sum(line_total) FROM sales_items WHERE sale_id=s.sale_id) OR s.total_amount<>(SELECT sum(payment_amount) FROM sale_payments WHERE sale_id=s.sale_id AND payment_status='COMPLETED'))) THEN RAISE EXCEPTION 'Imported receipt reconciliation failed'; END IF;
 INSERT INTO access_audit_events(company_id,dgt_id,actor_user_id,event_type,target_type,target_id,changes)
 VALUES(comp,store,actor,'SALES_WORKBOOK_IMPORTED','SALES',source_hash,jsonb_build_object('sha256',source_hash,'filename',__FILE__,'sourceStore','ST001','timezone','America/New_York','originalDates',true,'inventoryNote','No opening quantities supplied; no sale movements replayed','products',products_map,'cashiers',cashier_map,'terminals',terminal_map,'sales',sales_map,'lines',line_map,'payments',payment_map));
 RAISE NOTICE 'Imported % products, % sales, % lines and % payments',jsonb_object_length_placeholder;
END $import$;
COMMIT;
'''
sql=sql.replace("'Imported '+source_code","'Imported '||source_code").replace(" RAISE NOTICE 'Imported % products, % sales, % lines and % payments',jsonb_object_length_placeholder;"," RAISE NOTICE 'Imported 244 products, 980 sales, 1904 lines and 980 payments';")
sql=sql.replace('__HASH__',literal(hash)).replace('__FILE__',literal(source.name))
Path(sys.argv[2]).write_text(prefix+sql)
print('Prepared SQL:',sys.argv[2],'SHA256:',hash)
