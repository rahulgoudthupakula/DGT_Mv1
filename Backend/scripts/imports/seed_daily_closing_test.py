"""Sample cash for May 1–Aug 6, 2026. Test backend only; preserve source sales."""
import os,json,base64,urllib.request,random
from decimal import Decimal
from datetime import date,timedelta
BASE='http://127.0.0.1:8181/api/v1/access/stores/'
auth=base64.b64encode(('admin@dgt.test:'+os.environ['DGT_TEST_ADMIN_PASSWORD']).encode()).decode()
def request(store,path='',body=None):
 r=urllib.request.Request(BASE+store+'/daily-closing'+path,data=None if body is None else json.dumps(body).encode(),headers={'Authorization':'Basic '+auth,'Content-Type':'application/json'},method='GET' if body is None else 'PUT')
 with urllib.request.urlopen(r) as response:return json.load(response)
scenarios=['balanced','no_cash_movements','cash_added','payout_only','drop_only','mixed_cash','small_shortage','small_overage','large_shortage','large_overage','zero_closing_cash','leave_base_float']
counts={}
for store,base in [('DGT-1017',100),('DGT-1018',150)]:
 for index in range((date(2026,8,6)-date(2026,5,1)).days+1):
  business=date(2026,5,1)+timedelta(days=index);day=business.isoformat();old=request(store,'/'+day)
  if old['status']!='OPEN':
   counts['preserved']=counts.get('preserved',0)+1;continue
  rng=random.Random(store+day);scenario=scenarios[index%len(scenarios)]
  opening=Decimal(base)
  # Two opening-count variations per month; other days use the normal store float.
  if business.day==2:opening-=Decimal('2')
  if business.day==5:opening+=Decimal('1.50')
  cash=sum((Decimal(str(t['amount'])) for t in old['source']['tenders'] if t['code']=='CASH'),Decimal(0))
  added=Decimal(0);payout=Decimal(0);drops=Decimal(0);variance=Decimal(0)
  if scenario in ['cash_added','mixed_cash']:added=Decimal(rng.randint(10,50))
  if scenario in ['payout_only','mixed_cash']:payout=Decimal(rng.randint(2,25))+Decimal('0.25')
  if scenario in ['drop_only','mixed_cash']:drops=(max(cash,Decimal(0))*Decimal('0.40')).quantize(Decimal('.01'))
  available=opening+cash+added-payout
  if scenario=='zero_closing_cash':drops=available
  if scenario=='leave_base_float':
   if available<base:added+=Decimal(base)-available;available=Decimal(base)
   drops=available-Decimal(base)
  expected=opening+cash+added-payout-drops
  if scenario=='small_shortage':variance=Decimal('-0.75')
  if scenario=='small_overage':variance=Decimal('1.25')
  if scenario=='large_shortage':variance=Decimal('-25')
  if scenario=='large_overage':variance=Decimal('30')
  assert expected>=0 and expected+variance>=0
  payload={'version':old['version'],'sourceToken':old['sourceToken'],'openingCash':float(opening),'cashAdded':float(added),'cashDrops':float(drops),'payouts':float(payout),'actualCash':float(expected+variance),'notes':'SAMPLE_CLOSING_20260913: '+scenario+'. Test cash only, not POS/physical counts. Opening float normally $'+str(base)+'. Historical sales preserved.','close':index%3!=0}
  saved=request(store,'/'+day,payload)
  assert Decimal(str(saved['expectedCash']))==expected
  assert Decimal(str(saved['variance']))==variance
  counts[scenario]=counts.get(scenario,0)+1
  if business.day==1 or business.day==15:print(store,day,'saved',flush=True)
print(json.dumps(counts,sort_keys=True),flush=True)
