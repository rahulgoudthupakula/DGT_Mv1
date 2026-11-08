"""Read the supplied workbook as data only; no formulas/macros are executed."""
import zipfile,xml.etree.ElementTree as E,json,sys
from collections import Counter,defaultdict
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime,timedelta
N={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def workbook(path):
 with zipfile.ZipFile(path) as z:
  strings=[]
  if 'xl/sharedStrings.xml' in z.namelist():strings=[''.join(t.itertext()) for t in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',N)]
  result={}
  for i,name in enumerate(['products','sales','items','payments'],1):
   rows=[]
   for row in E.fromstring(z.read(f'xl/worksheets/sheet{i}.xml')).findall('s:sheetData/s:row',N):
    cells={}
    for c in row:
     v=c.find('s:v',N);value=v.text if v is not None else ''.join(c.find('s:is',N).itertext()) if c.find('s:is',N) is not None else ''
     if c.get('t')=='s':value=strings[int(value)]
     cells[''.join(ch for ch in c.get('r') if ch.isalpha())]=value
    if any(cells.values()):rows.append(cells)
   header=rows[0];result[name]=[{header[k]:r.get(k,'') for k in header} for r in rows[1:] if r.get('A')]
  return result
def date(value):return datetime(1899,12,30)+timedelta(seconds=int((Decimal(value)*86400).quantize(Decimal('1'),rounding=ROUND_HALF_UP)))
def inspect(data):
 print('Counts:',{k:len(v) for k,v in data.items()})
 for k,field in [('products','department'),('products','unit_of_measure'),('sales','cashier_id'),('sales','terminal_id'),('sales','sale_status'),('sales','transaction_type'),('payments','payment_method'),('payments','payment_status')]:print(k,field,dict(Counter(r[field] for r in data[k])))
 print('Sale date range:',min(date(r['sale_datetime']) for r in data['sales']),max(date(r['sale_datetime']) for r in data['sales']))
 products={p['product_id'] for p in data['products']};sales={s['sale_id'] for s in data['sales']}
 print('Missing product refs:',{i['product_id'] for i in data['items']}-products)
 print('Missing sale refs:',{i['sale_id'] for i in data['items']+data['payments']}-sales)
 lines=defaultdict(list);payments=defaultdict(list)
 for i in data['items']:lines[i['sale_id']].append(i)
 for p in data['payments']:payments[p['sale_id']].append(p)
 problems=[]
 for s in data['sales']:
  sid=s['sale_id'];total=Decimal(s['total_amount']);lt=sum(Decimal(i['line_total']) for i in lines[sid]);pt=sum(Decimal(p['payment_amount']) for p in payments[sid] if p['payment_status']=='COMPLETED')
  if abs(total-lt)>Decimal('.01') or (s['sale_status']=='COMPLETED' and abs(total-pt)>Decimal('.01')):problems.append({'sale':sid,'status':s['sale_status'],'total':str(total),'line_total':str(lt),'paid':str(pt)})
 print('Reconciliation issues:',len(problems),problems[:12]);print('Sales without lines',len(sales-set(lines)),'without payments',len(sales-set(payments)))
 print('IDs duplicate',{name:len(rows)-len({r[next(iter(r))] for r in rows}) for name,rows in data.items()})
 return problems
if __name__=='__main__':
 data=workbook(sys.argv[1]);inspect(data)
 if len(sys.argv)>2:
  with open(sys.argv[2],'w') as f:json.dump(data,f,indent=2)
