"""Generate JDBC table layers and OpenAPI from the inspected schema; no database connection or writes."""
import json,re
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
ROOT=BASE/'src/main/java/com/dgt/backend'
PKG='com.dgt.backend'
snapshot=json.loads((BASE/'docs/schema/catalog.json').read_text())
columns={}
for col in snapshot['columns']:columns.setdefault(col['table_name'],[]).append(col)
constraints={t:[] for t in columns}
for c in snapshot['constraints']:constraints[c['table_name']].append(c)

def module(t):
 if t.startswith(('employee','employees')):return 'employees'
 if t.startswith('fuel_'):return 'fuel'
 if t.startswith('lottery_'):return 'lottery'
 if t.startswith('vendor_') or t=='vendors':return 'vendors'
 if t.startswith('inventory_'):return 'inventorymovements' if t=='inventory_movements' else 'inventory'
 if t in ['inventory']:return 'inventory'
 if t in ['sales','sales_items','sale_payments','pos_terminals','tender_types']:return 'sales'
 if t in ['users','user_roles','role_types','permissions','modules','status_types']:return 'identity'
 if t in ['stores','store_contact_info','store_business_hours']:return 'stores'
 if t in ['departments','store_departments','store_sub_departments']:return 'departments'
 if t in ['products','brands','new_arrivals']:return 'products'
 if t=='product_barcodes':return 'productbarcodes'
 if t=='product_vendors':return 'productvendors'
 if t in ['product_store_prices','price_groups','product_price_groups']:return 'productstoreprices'
 if t.startswith('promotion'):return 'promotions'
 if t in ['everyday_closing','daily_expenses','daily_closing_tenders','daily_closing_deposits']:return 'dailyclosing'
 if t in ['billing_invoices','store_subscriptions','subscription_plans']:return 'billing'
 return 'invoices'

def cname(t):
 overrides={'inventory':'Inventory','sales':'Sale','sales_items':'SaleItem','everyday_closing':'EverydayClosing','store_contact_info':'StoreContactInfo','employee_compensation':'EmployeeCompensation','employee_status_history':'EmployeeStatusHistory','vendor_item_cost_history':'VendorItemCostHistory','vendor_audit_log':'VendorAuditLog','invoice_audit_log':'InvoiceAuditLog','lottery_pack_inventory':'LotteryPackInventory'}
 if t in overrides:return overrides[t]
 return ''.join(x.title() for x in (t[:-1] if t.endswith('s') else t).split('_'))
def camel(s):return s.split('_')[0]+''.join(x.title() for x in s.split('_')[1:])
def java_type(c):return {'int8':'Long','int4':'Integer','varchar':'String','text':'String','numeric':'BigDecimal','bool':'Boolean','date':'LocalDate','time':'LocalTime','timestamptz':'OffsetDateTime','jsonb':'JsonNode'}[c['udt_name']]
def literal(s):return json.dumps(s)
def write(m,l,n,s,imports=''):
 p=ROOT/m/l/(n+'.java');p.parent.mkdir(parents=True,exist_ok=True);p.write_text(f'package {PKG}.{m}.{l};\n\n'+imports+'\n'+s+'\n')
# Historical/financial writes require workflows; access policy remains unconfigured until approved.
masters={'stores','store_contact_info','store_business_hours','departments','store_departments','store_sub_departments','products','brands','product_barcodes','vendors','product_vendors','product_store_prices','price_groups','product_price_groups','promotions','promotion_products','fuel_grades','fuel_tanks','fuel_pumps','lottery_games','lottery_settings','subscription_plans','pos_terminals','tender_types','employees','employee_emergency_contacts','employee_documents','employee_schedules','employee_store_assignments','employee_compensation'}
resources=[]
for t,cols in columns.items():
 m=module(t);n=cname(t)
 pk=[x for x in constraints[t] if x['contype']=='p'];assert len(pk)==1,t
 key=re.search(r'PRIMARY KEY \((\w+)\)',pk[0]['definition']).group(1)
 key_col=next(c for c in cols if c['column_name']==key)
 jt=java_type(key_col)
 fields='@JsonProperty("_version") String rowVersion,\n        '+',\n        '.join(f'{"@com.fasterxml.jackson.annotation.JsonIgnore" if c["column_name"] == "password_hash" else chr(64)+"JsonProperty("+literal(c["column_name"])+")"} {java_type(c)} {camel(c["column_name"])}' for c in cols)
 casts='Rows.value(row,"_version",String.class),\n            '+',\n            '.join(f'Rows.value(row,"{c["column_name"]}",{java_type(c)}.class)' for c in cols)
 write(m,'entity',n,f'''/** Persistence model for public.{t}; IDs and types follow the inspected database. */
public record {n}(
        {fields}) {{
    public static {n} fromRow(Map<String,Object> row) {{
        return new {n}(
            {casts});
    }}
}}''','import java.util.Map;\nimport java.math.BigDecimal;\nimport java.time.*;\nimport tools.jackson.databind.JsonNode;\nimport com.fasterxml.jackson.annotation.JsonProperty;\nimport com.dgt.backend.common.entity.Rows;')
 defs=[]
 for c in cols:
  generated=c['is_identity']=='YES' or c['column_default'] is not None and (c['column_default'].startswith('nextval(') or c['column_name']==key)
  readonly=generated or c['column_name'] in ['created_at','updated_at','created_date','updated_date','password_hash','company_id']
  defs.append('new Column('+','.join([literal(c['column_name']),literal(c['udt_name']),str(c['is_nullable']=='YES').lower(),str(c['column_default'] is not None).lower(),str(readonly).lower(),str(c['character_maximum_length'] or 0),str(c['numeric_precision'] or 0),str(c['numeric_scale'] or 0)])+')')
 write(m,'database',n+'Database',f'''public final class {n}Database {{
    private {n}Database() {{}}
    public static final Table TABLE = new Table("{t}","{key}","{m}",{str(t in masters).lower()},List.of(
        {','+chr(10)+'        '.join([]) if False else (','+chr(10)+'        ').join(defs)}));
}}''','import java.util.List;\nimport com.dgt.backend.common.database.Column;\nimport com.dgt.backend.common.database.Table;')
 # Users are read through a safe response projection rather than serializing password hashes.
 readtype=n if t!='users' else 'Map<String,Object>'
 mapper=f'{n}.fromRow(rows.get(TABLE,id))' if t!='users' else 'rows.get(TABLE,id)'
 write(m,'repository',n+'Repository',f'''@Repository
public class {n}Repository {{
    private final SchemaRepository rows;
    public {n}Repository(SchemaRepository rows) {{ this.rows=rows; }}
    public Map<String,Object> list(int page,int size) {{ return rows.list(TABLE,page,size); }}
    public {readtype} findById({jt} id) {{ return {mapper}; }}
    public Map<String,Object> create(Map<String,Object> values) {{ return rows.insert(TABLE,values); }}
    public Map<String,Object> update({jt} id,Map<String,Object> values,String expected) {{ return rows.update(TABLE,id,values,expected); }}
}}''',f'import java.util.*;\nimport org.springframework.stereotype.Repository;\nimport com.dgt.backend.common.repository.SchemaRepository;\nimport {PKG}.{m}.entity.{n};\nimport static {PKG}.{m}.database.{n}Database.TABLE;')
 write(m,'service',n+'Service',f'''@Service
public class {n}Service {{
    private final {n}Repository repository;
    private final WriteValidator validator;
    public {n}Service({n}Repository repository,WriteValidator validator) {{ this.repository=repository; this.validator=validator; }}
    public Map<String,Object> list(int page,int size) {{ return repository.list(page,size); }}
    public {readtype} get({jt} id) {{ return repository.findById(id); }}
    @Transactional
    public Map<String,Object> create(Map<String,Object> values) {{ return repository.create(validator.validate(TABLE,values,true)); }}
    @Transactional
    public Map<String,Object> update({jt} id,Map<String,Object> values,String expected) {{ var validated=validator.validate(TABLE,values,false); validator.validateUpdate(TABLE,id,validated); return repository.update(id,validated,expected); }}
}}''',f'import java.util.*;\nimport org.springframework.stereotype.Service;\nimport org.springframework.transaction.annotation.Transactional;\nimport com.dgt.backend.common.service.WriteValidator;\nimport {PKG}.{m}.repository.{n}Repository;\nimport {PKG}.{m}.entity.{n};\nimport static {PKG}.{m}.database.{n}Database.TABLE;')
 path=t.replace('_','-')
 write(m,'controller',n+'Controller',f'''@RestController
@RequestMapping("/api/v1/{path}")
public class {n}Controller {{
    private final {n}Service service;
    public {n}Controller({n}Service service) {{ this.service=service; }}
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, '{t}', 'READ')")
    public Map<String,Object> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size) {{ return service.list(page,size); }}
    @GetMapping("/{{id}}")
    @PreAuthorize("@accessPolicy.check(authentication, '{t}', 'READ')")
    public {readtype} get(@PathVariable {jt} id) {{ return service.get(id); }}
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, '{t}', 'WRITE')")
    public Map<String,Object> create(@RequestBody Map<String,Object> values) {{ return service.create(values); }}
    @PatchMapping("/{{id}}")
    @PreAuthorize("@accessPolicy.check(authentication, '{t}', 'WRITE')")
    public Map<String,Object> update(@PathVariable {jt} id,@RequestHeader("If-Match") String expected,@RequestBody Map<String,Object> values) {{ return service.update(id,values,expected); }}
}}''',f'import java.util.*;\nimport org.springframework.web.bind.annotation.*;\nimport org.springframework.security.access.prepost.PreAuthorize;\nimport {PKG}.{m}.service.{n}Service;\nimport {PKG}.{m}.entity.{n};')
 resources.append((t,m,n,key,jt))
write('common','database','SchemaCatalog','''@Component
public class SchemaCatalog {
    public List<Table> tables() { return List.of(
        '''+(',\n        '.join(f'{PKG}.{m}.database.{n}Database.TABLE' for t,m,n,k,j in resources))+'''); }
}''','import java.util.List;\nimport org.springframework.stereotype.Component;')
(BASE/'docs/schema/modules.json').write_text(json.dumps([{'table':t,'module':m,'entity':n,'primaryKey':k,'idType':j,'masterWrites':t in masters} for t,m,n,k,j in resources],indent=2)+'\n')
print(f'Generated five Java layers for {len(resources)} tables.')
