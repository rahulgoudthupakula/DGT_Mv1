-- User-authorized sample available quantities for imported Store1 products only.
BEGIN;
SET LOCAL lock_timeout='5s';
DO $seed$
DECLARE a record; r record; target numeric; movement bigint; seeded integer:=0; mapping jsonb:='[]';
BEGIN
 IF current_database()<>'dgt_test' THEN RAISE EXCEPTION 'Test database required'; END IF;
 PERFORM 1 FROM stores WHERE dgt_id='DGT-1017' FOR UPDATE;
 IF EXISTS(SELECT 1 FROM access_audit_events WHERE dgt_id='DGT-1017' AND event_type='SALES_WORKBOOK_SAMPLE_STOCK') THEN
  RAISE NOTICE 'Sample stock already seeded; no changes'; RETURN;
 END IF;
 SELECT * INTO STRICT a FROM access_audit_events WHERE dgt_id='DGT-1017' AND event_type='SALES_WORKBOOK_IMPORTED' AND changes->>'sha256'='a0b3f2ff1ca786b49fb5529a20a8063215711fdeb17feef9bc3784a666962fa0';
 FOR r IN SELECT p.product_id,p.unit_of_measure,i.available_quantity,i.cost
 FROM jsonb_each_text(a.changes->'products') m JOIN products p ON p.product_id=m.value::bigint AND p.dgt_id='DGT-1017'
 JOIN inventory i ON i.product_id=p.product_id AND i.dgt_id=p.dgt_id FOR UPDATE OF i LOOP
  IF r.available_quantity<>0 OR EXISTS(SELECT 1 FROM inventory_movements WHERE dgt_id='DGT-1017' AND product_id=r.product_id) THEN
   RAISE EXCEPTION 'Imported item % already has stock or movements; no overwrite',r.product_id;
  END IF;
  target:=CASE WHEN lower(r.unit_of_measure) IN ('gallon','gallons') THEN floor(1000+random()*7001) ELSE floor(12+random()*229) END;
  INSERT INTO inventory_movements(dgt_id,product_id,movement_type,qty_changed,unit_cost)
   VALUES('DGT-1017',r.product_id,'ADJUSTMENT',target,r.cost) RETURNING movement_id INTO movement;
  UPDATE inventory i SET available_quantity=i.available_quantity+m.qty_changed,updated_at=CURRENT_TIMESTAMP
   FROM inventory_movements m WHERE m.movement_id=movement AND i.product_id=m.product_id AND i.dgt_id=m.dgt_id;
  mapping:=mapping||jsonb_build_array(jsonb_build_object('productId',r.product_id,'movementId',movement,'sampleQuantity',target));
  seeded:=seeded+1;
 END LOOP;
 IF seeded<>244 THEN RAISE EXCEPTION 'Expected 244 imported items, found %',seeded; END IF;
 INSERT INTO access_audit_events(company_id,dgt_id,actor_user_id,event_type,target_type,target_id,changes)
 VALUES(a.company_id,'DGT-1017',a.actor_user_id,'SALES_WORKBOOK_SAMPLE_STOCK','INVENTORY','workbook-test-stock',jsonb_build_object('sampleData',true,'note','Random sample stock, not physical counts; no historical sales replay or gas tank changes','items',mapping));
 RAISE NOTICE 'Seeded % sample quantities with inventory movements',seeded;
END $seed$;
COMMIT;
