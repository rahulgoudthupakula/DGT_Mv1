-- Test-only financial fixtures; no schema or physical inventory changes.
BEGIN;
DO $$
DECLARE r record; sale bigint; fuel bigint; merchandise bigint; employee bigint; terminal bigint;
 fleet bigint; cash bigint; selected_item bigint;
BEGIN
 IF current_database()<>'dgt_test' THEN RAISE EXCEPTION 'Test database only'; END IF;
 SELECT cashier_id,terminal_id INTO STRICT employee,terminal FROM sales WHERE store_id='DGT-1017' ORDER BY sale_id LIMIT 1;
 SELECT p.product_id INTO STRICT fuel FROM products p
  JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=p.dgt_id
  JOIN store_departments d ON d.store_department_id=sub.store_department_id AND d.dgt_id=p.dgt_id
  WHERE p.dgt_id='DGT-1017' AND lower(d.store_department_name)='fuel' AND lower(p.unit_of_measure)='gallon' ORDER BY p.product_id LIMIT 1;
 SELECT p.product_id INTO STRICT merchandise FROM products p
  JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=p.dgt_id
  JOIN store_departments d ON d.store_department_id=sub.store_department_id AND d.dgt_id=p.dgt_id
  WHERE p.dgt_id='DGT-1017' AND lower(d.store_department_name) NOT IN ('fuel','gas') AND lower(p.unit_of_measure)='gallon' ORDER BY p.product_id LIMIT 1;
 INSERT INTO tender_types(tender_code,tender_name) VALUES ('FLEET_CARD','Fleet Card') ON CONFLICT(tender_code) DO NOTHING;
 SELECT tender_type_id INTO STRICT fleet FROM tender_types WHERE tender_code='FLEET_CARD';
 SELECT tender_type_id INTO STRICT cash FROM tender_types WHERE tender_code='CASH';
 FOR r IN SELECT * FROM (VALUES
  ('SAMPLE-FLEET-FUEL','SALE',100,100,0,25,10,false),
  ('SAMPLE-FLEET-REFUND','REFUND',-8,-8,0,-2,11,false),
  ('SAMPLE-FLEET-MIXED','SALE',60,30,30,15,12,false),
  ('SAMPLE-FLEET-MERCH','SALE',8,8,0,2,13,true)
 ) AS v(ref,kind,total,fleet_total,cash_total,qty,hour,merch) LOOP
  IF EXISTS(SELECT 1 FROM sales WHERE transaction_id='DGT-1017-'||r.ref) THEN CONTINUE; END IF;
  selected_item=CASE WHEN r.merch THEN merchandise ELSE fuel END;
  INSERT INTO sales(store_id,cashier_id,terminal_id,receipt_no,transaction_id,transaction_type,sale_status,sale_datetime,subtotal,total_amount,total_items)
   VALUES('DGT-1017',employee,terminal,r.ref,'DGT-1017-'||r.ref,r.kind,'COMPLETED',
    make_timestamptz(2026,8,8,r.hour,0,0,'America/New_York'),r.total,r.total,abs(r.qty)) RETURNING sale_id INTO sale;
  INSERT INTO sales_items(sale_id,product_id,quantity,catalog_price,unit_price,gross_amount,line_total)
   VALUES(sale,selected_item,r.qty,4,4,r.total,r.total);
  INSERT INTO sale_payments(sale_id,tender_type_id,payment_amount,payment_status,payment_datetime)
   VALUES(sale,fleet,r.fleet_total,CASE WHEN r.kind='REFUND' THEN 'REFUNDED' ELSE 'COMPLETED' END,make_timestamptz(2026,8,8,r.hour,0,0,'America/New_York'));
  IF r.cash_total<>0 THEN
   INSERT INTO sale_payments(sale_id,tender_type_id,payment_amount,payment_status,payment_datetime)
    VALUES(sale,cash,r.cash_total,'COMPLETED',make_timestamptz(2026,8,8,r.hour,0,0,'America/New_York'));
  END IF;
 END LOOP;
END $$;
COMMIT;
