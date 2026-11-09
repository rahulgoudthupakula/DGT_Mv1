"""Generate the current schema API contract; this script never accesses a database."""
import json
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
source=json.loads((BASE/'docs/schema/catalog.json').read_text())
modules=json.loads((BASE/'docs/schema/modules.json').read_text())
paths={};schemas={}
types={'int8':{'type':'integer','format':'int64'},'int4':{'type':'integer','format':'int32'},'numeric':{'type':'number'},'bool':{'type':'boolean'},'date':{'type':'string','format':'date'},'time':{'type':'string','format':'time'},'timestamptz':{'type':'string','format':'date-time'},'varchar':{'type':'string'},'text':{'type':'string'},'jsonb':{}}
errors={str(k):{'description':v} for k,v in [(400,'Invalid input'),(401,'Authentication required'),(403,'Access denied or protected default'),(404,'Record not found'),(409,'Conflict, constraint violation, or timezone setup required'),(501,'Business workflow not implemented'),(503,'Access policy not configured')]}
page=[{'name':'page','in':'query','schema':{'type':'integer','minimum':0,'maximum':1000000,'default':0}},{'name':'size','in':'query','schema':{'type':'integer','minimum':1,'maximum':200,'default':50}}]
for r in modules:
 table=r['table'];name=r['entity'];props={};writable={};required=[]
 for c in [c for c in source['columns'] if c['table_name']==table]:
  field=c['column_name']
  if field=='password_hash':continue
  spec=types[c['udt_name']].copy()
  if c['is_nullable']=='YES' and 'type' in spec:spec['type']=[spec['type'],'null']
  if c['character_maximum_length']:spec['maxLength']=c['character_maximum_length']
  generated=c['is_identity']=='YES' or c['column_default'] is not None and (c['column_default'].startswith('nextval(') or field==r['primaryKey'])
  readonly=generated or field in ['created_at','updated_at','created_date','updated_date']
  if readonly:spec['readOnly']=True
  props[field]=spec
  if not readonly:
   writable[field]=spec
   if c['is_nullable']=='NO' and c['column_default'] is None:required.append(field)
 props['_version']={'type':'string','readOnly':True,'description':'Send this opaque revision as If-Match when patching.'}
 if table=='stores':props['timezone']['description']='IANA timezone per store; null means setup pending. Required before local-business-date operations.'
 schemas[name]={'type':'object','properties':props}
 schemas[name+'Create']={'type':'object','properties':writable,'required':required,'additionalProperties':False}
 schemas[name+'Patch']={'type':'object','properties':{k:v for k,v in writable.items() if k!=r['primaryKey']},'minProperties':1,'additionalProperties':False}
 ref={'$ref':'#/components/schemas/'+name}
 key={'name':'id','in':'path','required':True,'schema':{'type':'string'} if r['idType']=='String' else {'type':'integer','format':'int64'}}
 path='/'+table.replace('_','-')
 for method,suffix in [('get',''),('get','/{id}'),('post',''),('patch','/{id}')]:
  parameters=([key] if suffix else page if method=='get' else [])
  if method=='patch':parameters=parameters+[{'name':'If-Match','in':'header','required':True,'schema':{'type':'string'}}]
  status='201' if method=='post' else '200'
  response=ref if suffix or method=='post' else {'type':'object','properties':{'items':{'type':'array','items':ref},'page':{'type':'integer'},'size':{'type':'integer'},'total':{'type':'integer'}}}
  op={'tags':[r['module']],'summary':method.upper()+' '+table,'parameters':parameters,'responses':{status:{'description':'Success','content':{'application/json':{'schema':response}}},**errors}}
  if method in ['post','patch']:
   op['requestBody']={'required':True,'content':{'application/json':{'schema':{'$ref':'#/components/schemas/'+name+('Create' if method=='post' else 'Patch')}}}}
   if not r['masterWrites'] or table=='departments':
    op['responses'].pop(status)
    op['description']='Read-only through this API. Global department definitions are protected; financial workflows await confirmed rules.'
   elif table in ['store_departments','store_sub_departments']:
    op['description']='Custom store definitions may be edited. DEFAULT and UNCLASSIFIED rows cannot be changed. Ownership/source cannot be reassigned. See docs/STORE_TIMEZONE_DEPARTMENTS.md.'
  paths.setdefault(path+suffix,{})[method]=op
paths['/stores/{id}/business-day']={'get':{'summary':'Store-local date converted to an inclusive/exclusive UTC interval; honors DST',
 'parameters':[{'name':'id','in':'path','required':True,'schema':{'type':'string'}},{'name':'date','in':'query','required':True,'schema':{'type':'string','format':'date'}}],
 'responses':{'200':{'description':'BusinessDay with dgtId, timezone, date, startInclusive and endExclusive'},**errors}}}
for route in ['health','auth/me','barcode-lookup','reports/sales','reports/inventory']:
 paths['/'+route]={'get':{'summary':route,'responses':{'200':{'description':'Success'},**errors}}}
paths['/health']['get']['security']=[]
paths['/barcode-lookup']['get']['parameters']=[{'name':n,'in':'query','required':True,'schema':{'type':'string'}} for n in ['storeId','barcode']]
paths['/reports/sales']['get']['parameters']=[{'name':n,'in':'query','required':True,'schema':{'type':'string',**({'format':'date-time'} if n in ['from','to'] else {})}} for n in ['storeId','from','to']]
paths['/reports/inventory']['get']['parameters']=[{'name':'dgtId','in':'query','required':True,'schema':{'type':'string'}}]+page
for route in ['payroll','inventory/adjustments','auth/change-password','billing-invoices/{id}/record-payment']:
 op={'summary':'Unavailable until workflow rules are confirmed','responses':errors,'requestBody':{'required':True,'content':{'application/json':{'schema':{'type':'object'}}}}}
 if '{id}' in route:op['parameters']=[{'name':'id','in':'path','required':True,'schema':{'type':'integer','format':'int64'}}]
 paths['/'+route]={'post':op}
 if route=='payroll':paths['/'+route]['get']={'summary':'Payroll schema not provided','responses':errors}
spec={'openapi':'3.1.0','info':{'title':'DGT backend — proposed timezone/department schema','version':'0.2.0','description':'Requires the reviewed proposal migration. Schema-aligned APIs use snake_case and explicit administrator access. Company/module approval rules remain pending.'},'servers':[{'url':'http://localhost:8180/api/v1'}],'security':[{'basicAuth':[]}],'paths':paths,'components':{'securitySchemes':{'basicAuth':{'type':'http','scheme':'basic'}},'schemas':schemas}}
(BASE/'src/main/resources/static/openapi.json').write_text(json.dumps(spec,indent=2)+'\n')
print('Updated API contract for',len(modules),'tables and store business-day lookup.')
