"""Exercise dashboard SQL with isolated PostgreSQL TEMP tables; never modify application tables.
Run with DGT_TEST_CONTAINER set to a local development PostgreSQL container.
"""
import json, os, pathlib, subprocess
root=pathlib.Path(__file__).resolve().parents[2]
sql=(root/'src/main/resources/reports/sales-statistics.sql').read_text()
fixture='''
BEGIN;
CREATE TEMP TABLE stores(dgt_id text);
CREATE TEMP TABLE sales(sale_id bigint,store_id text,terminal_id bigint,sale_datetime timestamptz,transaction_type text,sale_status text);
CREATE TEMP TABLE pos_terminals(terminal_id bigint,store_id text);
CREATE TEMP TABLE sales_items(sale_id bigint,product_id bigint,quantity numeric,gross_amount numeric,discount_amount numeric);
CREATE TEMP TABLE products(product_id bigint,dgt_id text,product_name text,store_sub_department_id bigint);
CREATE TEMP TABLE store_sub_departments(store_sub_department_id bigint,dgt_id text,store_department_id bigint,store_sub_department_name text);
CREATE TEMP TABLE store_departments(store_department_id bigint,dgt_id text,store_department_name text);
INSERT INTO pos_terminals VALUES(1,'A'),(2,'B');
INSERT INTO store_departments VALUES(1,'A','Grocery'),(2,'A','Fuel'),(3,'A','Lottery Tickets');
INSERT INTO store_sub_departments VALUES(1,'A',1,'Beverages'),(2,'A',2,'Fuel'),(3,'A',3,'Lottery');
INSERT INTO products VALUES(1,'A','Cola',1),(2,'A','Regular',2),(3,'A','Ticket',3),(4,'B','Foreign',NULL);
INSERT INTO sales VALUES
(1,'A',1,'2026-05-03 03:30Z','SALE','COMPLETED'),
(2,'A',1,'2026-05-03 03:40Z','REFUND','REFUNDED'),
(3,'A',1,'2026-04-30 12:00Z','SALE','COMPLETED'),
(4,'A',1,'2026-05-03 12:00Z','VOID','VOIDED'),
(5,'B',2,'2026-05-03 12:00Z','SALE','COMPLETED');
INSERT INTO sales_items VALUES(1,1,2,20,2),(1,1,0.5,5,0),(2,1,1,10,1),(3,1,1,10,0),
(1,2,10,50,0),(1,3,1,10,0),(4,1,1,999,0),(5,4,1,999,0);
'''
def query(start,end,previous,store='A'):
 vals=["'America/New_York'",repr(store),repr(start),repr(end),repr(previous)]
 result=sql
 for v in vals:result=result.replace('?',v,1)
 return result+';'
commands=fixture+query('2026-05-02','2026-05-03','2026-04-30')+query('2026-06-01','2026-06-01','2026-05-31')+query('2026-05-02','2026-05-03','2026-04-30','B')+'ROLLBACK;'
container=os.environ.get('DGT_TEST_CONTAINER','dgt-schema-test-20260910')
docker=os.environ.get('DOCKER','/Applications/Docker.app/Contents/Resources/bin/docker')
r=subprocess.run([docker,'exec','-i',container,'psql','-X','-qAt','-U','dgt_test','-d','dgt_test','-v','ON_ERROR_STOP=1'],input=commands,text=True,capture_output=True,check=True)
a,empty,other=[json.loads(line) for line in r.stdout.splitlines() if line.startswith('{')]
assert a['totals']=={'sales':14,'transactions':1,'avg':14,'items':1.5},a['totals']
assert a['prior']['sales']==10
assert a['hourlyTrend'][23]['sales']==14
assert a['dailySalesData']==[{'day':'2026-05-02','sales':14},{'day':'2026-05-03','sales':0}]
assert a['allTotal']==74 and a['statisticsTotals']['fuel_2']==50
assert a['topSellingItems'][0]['qty']==1.5 and a['topSellingItems'][0]['revenue']==14
assert a['hasGrocery'] and a['categoryPieValid']
assert empty['totals']['avg'] is None and not empty['hasSales'] and not empty['mixPieValid']
assert len(empty['hourlyTrend'])==24 and len(empty['dailySalesData'])==1
assert other['totals']['sales']==999 and other['topSellingItems'][0]['name']=='Foreign'
assert 'rows' not in a
print('PASS: refunds, discounts, fractional quantity, distinct receipts, timezone, prior period, fuel/lottery separation, void exclusion, empty range, store isolation')
