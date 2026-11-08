import os,json,base64,urllib.request,urllib.error
from datetime import date,timedelta
from decimal import Decimal
base='http://127.0.0.1:8181/api/v1/access/stores/'
auth=base64.b64encode(('admin@dgt.test:'+os.environ['DGT_TEST_ADMIN_PASSWORD']).encode()).decode()
def call(store,path,body=None):
 req=urllib.request.Request(base+store+'/daily-closing'+path,data=None if body is None else json.dumps(body).encode(),headers={'Authorization':'Basic '+auth,'Content-Type':'application/json'},method='GET' if body is None else 'PUT')
 try:
  with urllib.request.urlopen(req) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
for store in ['DGT-1017','DGT-1018']:
 days=[]
 for start,end in [('2026-05-01','2026-05-31'),('2026-06-01','2026-06-30'),('2026-07-01','2026-07-31'),('2026-08-01','2026-08-06')]:
  status,rows=call(store,'?start='+start+'&end='+end);assert status==200,(status,rows);days+=rows
 assert len(days)==98 and len({d['date'] for d in days})==98
 for d in days:
  assert d['isSample'] and d['status'] in ['DRAFT','CLOSED'],d
  cash=sum((Decimal(str(t['amount'])) for t in d['source']['tenders'] if t['code']=='CASH'),Decimal(0))
  expected=Decimal(str(d['openingCash']))+cash+Decimal(str(d['cashAdded']))-Decimal(str(d['cashDrops']))-Decimal(str(d['payouts']))
  assert expected==Decimal(str(d['expectedCash']))
  assert Decimal(str(d['actualCash']))-expected==Decimal(str(d['variance']))
 total=sum(Decimal(str(d['source']['stats']['netSales'])) for d in days)
 assert total==(Decimal('26827.12') if store=='DGT-1017' else Decimal(0)),total
 print(store,'98 days verified; sales',total,'draft',sum(d['status']=='DRAFT' for d in days),'closed',sum(d['status']=='CLOSED' for d in days),'zero drawer',sum(d['actualCash']==0 for d in days),flush=True)
 if store=='DGT-1017':
  draft=next(d for d in days if d['status']=='DRAFT')
  payload={k:draft[k] for k in ['version','sourceToken','openingCash','cashAdded','cashDrops','payouts','actualCash','notes']};payload['close']=False
  for key,value in [('openingCash',-1),('actualCash',-1),('payouts',1000000),('cashAdded',1.001),('version','stale')]:
   bad={**payload,key:value};code,_=call(store,'/'+draft['date'],bad);assert code==(409 if key=='version' else 400),(key,code)
  closed=next(d for d in days if d['status']=='CLOSED');bad={k:closed[k] for k in payload if k!='close'};bad['close']=False
  assert call(store,'/'+closed['date'],bad)[0]==409
  assert call(store,'/2099-01-01',payload)[0]==400
  after=call(store,'/'+draft['date'])[1];assert after['version']==draft['version']
  print('Invalid negative/overprecision/excess payouts, stale save, future date and closed edit blocked; saved data unchanged',flush=True)
