-- Aggregate once in the database. Never send receipt-level rows to dashboard clients.
WITH bounds AS (
 SELECT ?::text zone, ?::text store, ?::date start_date, ?::date end_date, ?::date previous_start
), lines AS MATERIALIZED (
 SELECT s.sale_id, p.product_id::text AS product_id, p.product_name AS name,
  (s.sale_datetime AT TIME ZONE b.zone)::date AS day,
  extract(hour FROM s.sale_datetime AT TIME ZONE b.zone)::int AS hour,
  coalesce(d.store_department_name,'Unassigned') department,
  coalesce(sub.store_sub_department_name,'Unassigned') category,
  CASE WHEN lower(trim(coalesce(d.store_department_name,''))) IN ('fuel','gas') THEN 'fuel'
       WHEN lower(trim(coalesce(d.store_department_name,''))) LIKE 'lottery%' THEN 'nonMerch' ELSE 'merch' END kind,
  CASE WHEN s.transaction_type='SALE' THEN 1 ELSE -1 END direction,
  abs(i.quantity) quantity, round(abs(i.gross_amount),2)-round(abs(i.discount_amount),2) amount
 FROM bounds b JOIN sales s ON s.store_id=b.store
 JOIN pos_terminals t ON t.terminal_id=s.terminal_id AND t.store_id=s.store_id
 JOIN sales_items i USING(sale_id)
 JOIN products p ON p.product_id=i.product_id AND p.dgt_id=s.store_id
 LEFT JOIN store_sub_departments sub ON sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=p.dgt_id
 LEFT JOIN store_departments d ON d.store_department_id=sub.store_department_id AND d.dgt_id=p.dgt_id
 WHERE s.sale_datetime >= (b.previous_start::timestamp AT TIME ZONE b.zone)
   AND s.sale_datetime < ((b.end_date+1)::timestamp AT TIME ZONE b.zone)
   AND ((s.transaction_type='SALE' AND s.sale_status='COMPLETED') OR
        (s.transaction_type IN ('RETURN','REFUND') AND s.sale_status IN ('COMPLETED','REFUNDED')))
), current_lines AS MATERIALIZED (
 SELECT l.* FROM lines l,bounds b WHERE l.day BETWEEN b.start_date AND b.end_date
), summary AS (
 SELECT period,coalesce(sum(direction*amount),0) sales,
 count(DISTINCT sale_id) FILTER(WHERE direction=1) transactions,
 round(coalesce(sum(direction*quantity),0),4) items
 FROM (VALUES ('current'),('previous')) periods(period)
 LEFT JOIN lines l ON l.kind='merch' AND
  ((period='current' AND l.day >= (SELECT start_date FROM bounds)) OR
   (period='previous' AND l.day < (SELECT start_date FROM bounds)))
 GROUP BY period
), summary_json AS (
 SELECT period,jsonb_build_object('sales',sales,'transactions',transactions,'items',items,
 'avg',CASE WHEN transactions>0 THEN sales/transactions ELSE NULL END) value FROM summary
), grades AS (
 SELECT DISTINCT product_id id,'fuel_'||product_id key,name FROM current_lines WHERE kind='fuel'
), keys AS (
 SELECT NULL::text id,'merch' key,'Merchandise' name,0 position UNION ALL
 SELECT NULL::text,'nonMerch','Non-Merch',1 UNION ALL
 SELECT id,key,name,(row_number() OVER(ORDER BY name,id)+1)::int FROM grades
), daily_amounts AS (
 SELECT day,CASE WHEN kind='fuel' THEN 'fuel_'||product_id ELSE kind END key,sum(direction*amount) amount
 FROM current_lines GROUP BY day,CASE WHEN kind='fuel' THEN 'fuel_'||product_id ELSE kind END
), daily AS (
 SELECT b.start_date+n AS day,jsonb_object_agg(k.key,coalesce(a.amount,0)) amounts,
 sum(coalesce(a.amount,0)) total
 FROM bounds b CROSS JOIN LATERAL generate_series(0,b.end_date-b.start_date) n CROSS JOIN keys k
 LEFT JOIN daily_amounts a ON a.day=b.start_date+n AND a.key=k.key GROUP BY b.start_date+n
), categories AS (
 SELECT department,category name,sum(direction*amount) value FROM current_lines WHERE kind='merch'
 GROUP BY department,category
), top_items AS (
 SELECT product_id id,min(name) name,min(category) category,round(sum(direction*quantity),4) qty,
 sum(direction*amount) revenue FROM current_lines WHERE kind='merch' GROUP BY product_id
 HAVING round(sum(direction*quantity),4)>0
 ORDER BY qty DESC,revenue DESC,name,id LIMIT 5
), mix AS (
 SELECT k.id,k.key,k.name,k.position,coalesce(sum(a.amount),0) value FROM keys k LEFT JOIN daily_amounts a USING(key)
 GROUP BY k.id,k.key,k.name,k.position
), total AS (SELECT coalesce(sum(direction*amount),0) amount FROM current_lines)
SELECT jsonb_build_object(
 'totals',(SELECT value FROM summary_json WHERE period='current'),
 'prior',(SELECT value FROM summary_json WHERE period='previous'),
 'data',(SELECT jsonb_agg(amounts||jsonb_build_object('date',day,'total',total,
   'merchPct',CASE WHEN total>0 THEN (amounts->>'merch')::numeric/total END,
   'nonMerchPct',CASE WHEN total>0 THEN (amounts->>'nonMerch')::numeric/total END) ORDER BY day) FROM daily),
 'grades',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'key',key,'name',name) ORDER BY name,id) FROM grades),'[]'::jsonb),
 'keys',(SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',id,'key',key,'name',name)) ORDER BY position) FROM keys),
 'mix',(SELECT jsonb_agg((CASE WHEN id IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('id',id) END)||jsonb_build_object('key',key,'name',name,'value',value,
   'pct',CASE WHEN (SELECT amount FROM total)>0 THEN value/(SELECT amount FROM total) END) ORDER BY position) FROM mix),
 'allTotal',(SELECT amount FROM total),
 'statisticsTotals',(SELECT jsonb_object_agg(key,value) FROM mix),
 'categoryData',coalesce((SELECT jsonb_agg(jsonb_build_object('name',name,'value',value) ORDER BY value DESC,department,name) FROM categories),'[]'::jsonb),
 'topSellingItems',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY rank) FROM
   (SELECT *,row_number() OVER(ORDER BY qty DESC,revenue DESC,name,id) rank FROM top_items) t),'[]'::jsonb),
 'dailySalesData',(SELECT jsonb_agg(jsonb_build_object('day',day,'sales',(amounts->>'merch')::numeric) ORDER BY day) FROM daily),
 'hourlyTrend',(SELECT jsonb_agg(jsonb_build_object('hour',((h+11)%12+1)::text||CASE WHEN h<12 THEN 'AM' ELSE 'PM' END,'sales',sales) ORDER BY h)
   FROM (SELECT h,coalesce(sum(l.direction*l.amount),0) sales FROM generate_series(0,23) h
   LEFT JOIN current_lines l ON l.hour=h AND l.kind='merch' GROUP BY h) hourly),
 'hasSales',EXISTS(SELECT 1 FROM current_lines),'hasGrocery',EXISTS(SELECT 1 FROM current_lines WHERE kind='merch'),
 'categoryPieValid',coalesce((SELECT bool_or(value>0) AND bool_and(value>=0) FROM categories),false),
 'mixPieValid',(SELECT bool_or(value>0) AND bool_and(value>=0) FROM mix),
 'unassigned',(SELECT count(*) FROM current_lines WHERE department='Unassigned')
)::text
