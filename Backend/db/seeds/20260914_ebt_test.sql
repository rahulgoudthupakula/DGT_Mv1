-- Test-only tender fixtures. No schema changes and no production execution.
-- Financial test receipts only: does not post physical inventory movements.
BEGIN;
DO $$
DECLARE r record; sale bigint; item bigint; employee bigint; terminal bigint;
 snap bigint; cash bigint; tid bigint;
BEGIN
 IF current_database()<>'dgt_test' THEN RAISE EXCEPTION 'Test database only'; END IF;
 SELECT cashier_id,terminal_id INTO STRICT employee,terminal FROM sales
  WHERE store_id='DGT-1017' ORDER BY sale_id LIMIT 1;
 SELECT product_id INTO STRICT item FROM products WHERE dgt_id='DGT-1017' AND is_ebt=true ORDER BY product_id LIMIT 1;
 INSERT INTO tender_types(tender_code,tender_name) VALUES ('EBT_SNAP','EBT SNAP'),('EBT_CASH','EBT Cash') ON CONFLICT(tender_code) DO NOTHING;
 SELECT tender_type_id INTO STRICT snap FROM tender_types WHERE tender_code='EBT_SNAP';
 SELECT tender_type_id INTO STRICT cash FROM tender_types WHERE tender_code='EBT_CASH';
 FOR r IN SELECT * FROM (VALUES
  ('SAMPLE-EBT-SNAP','SALE','COMPLETED',30,30,0,10),
  ('SAMPLE-EBT-CASH','SALE','COMPLETED',20,0,20,11),
  ('SAMPLE-EBT-SPLIT','SALE','COMPLETED',35,25,10,12),
  ('SAMPLE-EBT-REFUND','REFUND','REFUNDED',-5,-5,0,13),
  ('SAMPLE-EBT-VOID','VOID','VOIDED',10,10,0,14),
  ('SAMPLE-EBT-OPEN','SALE','OPEN',10,10,0,15)
 ) AS v(ref,kind,state,total,snap_total,cash_total,hour) LOOP
  IF EXISTS(SELECT 1 FROM sales WHERE transaction_id='DGT-1017-'||r.ref) THEN CONTINUE; END IF;
  INSERT INTO sales(store_id,cashier_id,terminal_id,receipt_no,transaction_id,transaction_type,sale_status,sale_datetime,subtotal,total_amount,total_items)
   VALUES ('DGT-1017',employee,terminal,r.ref,'DGT-1017-'||r.ref,r.kind,r.state,
    make_timestamptz(2026,8,7,r.hour,0,0,'America/New_York'),r.total,r.total,abs(r.total/5)) RETURNING sale_id INTO sale;
  INSERT INTO sales_items(sale_id,product_id,quantity,catalog_price,unit_price,gross_amount,line_total)
   VALUES(sale,item,r.total/5,5,5,r.total,r.total);
  -- Non-completed receipts are deliberately present to verify exclusion.
  IF r.snap_total<>0 THEN
   INSERT INTO sale_payments(sale_id,tender_type_id,payment_amount,payment_status,payment_datetime)
    VALUES(sale,snap,r.snap_total,CASE WHEN r.kind='REFUND' THEN 'REFUNDED' ELSE 'COMPLETED' END,
      make_timestamptz(2026,8,7,r.hour,0,0,'America/New_York'));
  END IF;
  IF r.cash_total<>0 THEN
   INSERT INTO sale_payments(sale_id,tender_type_id,payment_amount,payment_status,payment_datetime)
    VALUES(sale,cash,r.cash_total,'COMPLETED',make_timestamptz(2026,8,7,r.hour,0,0,'America/New_York'));
  END IF;
 END LOOP;
END $$;
COMMIT;
