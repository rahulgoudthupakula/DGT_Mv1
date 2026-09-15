package com.dgt.backend.pricebook;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/grocery-settings")
public class GrocerySettingsController {
 private final ScopedAccess a; private final ObjectMapper json;
 public GrocerySettingsController(ScopedAccess a,ObjectMapper json){this.a=a;this.json=json;}
 private static final LinkedHashMap<String,String> FIELDS=new LinkedHashMap<>();
 static {
  String[][] fields={{"defaultTaxType","default_tax_type"},{"overrideCategory","allow_subdepartment_tax_override"},{"overrideItem","allow_item_tax_override"},{"taxRounding","tax_rounding"},{"ebtExempt","ebt_tax_exempt"},{"wicExempt","wic_tax_exempt"},{"expiryTracking","expiry_tracking"},{"alertDays","expiry_alert_days"},{"expiredHandling","expired_item_handling"},{"dashboardNotif","expiry_dashboard_notification"},{"emailNotif","expiry_email_notification"},{"inAppNotif","expiry_in_app_notification"},{"reorderRule","reorder_rule"},{"leadTime","default_lead_time_days"},{"safetyStock","safety_stock_percentage"},{"itemOverride","allow_item_reorder_override"}};
  for(var f:fields)FIELDS.put(f[0],f[1]);
 }
 private void access(String store){
  if(a.admin(a.user(),a.company(store)))return;
  if(!Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM user_roles ur JOIN role_types rt USING(role_type_id) JOIN store_role_permissions p ON p.dgt_id=ur.dgt_id AND p.role_type_id=ur.role_type_id WHERE ur.user_id=? AND ur.dgt_id=? AND ur.is_active AND rt.is_active AND upper(rt.role_type_name)='MANAGER' AND p.permission_code='GROCERY_SETTINGS' AND p.allowed)",Boolean.class,a.user(),store)))throw a.denied();
 }
 private List<Map<String,Object>> margins(String store){return a.db.queryForList("SELECT s.store_sub_department_id::text AS key,s.xmin::text AS version,d.store_department_name AS dept,s.store_sub_department_name AS \"subDept\",s.default_margin_percentage AS margin FROM store_sub_departments s JOIN store_departments d ON d.store_department_id=s.store_department_id AND d.dgt_id=s.dgt_id WHERE s.dgt_id=? AND s.is_active AND d.is_active AND s.source_type<>'UNCLASSIFIED' ORDER BY d.store_department_name,s.store_sub_department_name,s.store_sub_department_id",store).stream().map(Rows::normalize).toList();}
 private Map<String,Object> settings(String store){var rows=a.db.queryForList("SELECT *,xmin::text AS version FROM grocery_settings WHERE dgt_id=?",store);if(rows.isEmpty())return null;var raw=rows.getFirst();var result=new LinkedHashMap<String,Object>();FIELDS.forEach((key,col)->result.put(key,raw.get(col)));return result;}
 @GetMapping @Transactional(readOnly=true,isolation=org.springframework.transaction.annotation.Isolation.REPEATABLE_READ) public Object get(@PathVariable String store){access(store);var out=new LinkedHashMap<String,Object>();out.put("settings",settings(store));out.put("version",version(store));out.put("margins",margins(store));out.put("audit",a.db.queryForList("SELECT e.event_id::text AS id,e.created_at AS timestamp,COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'') AS \"user\",e.changes::text AS changes FROM access_audit_events e JOIN users u ON u.user_id=e.actor_user_id WHERE e.dgt_id=? AND e.event_type='GROCERY_SETTINGS_CHANGED' ORDER BY e.event_id DESC LIMIT 100",store).stream().map(Rows::normalize).toList());return out;}
 @GetMapping("/defaults") @Transactional(readOnly=true,isolation=org.springframework.transaction.annotation.Isolation.REPEATABLE_READ) public Object defaults(@PathVariable String store){a.grant(a.user(),store,"PRICE_BOOK",false);var result=new LinkedHashMap<String,Object>();var settings=settings(store);result.put("defaultTaxType",settings==null?null:settings.get("defaultTaxType"));result.put("margins",margins(store));return result;}
 private String version(String store){var rows=a.db.queryForList("SELECT xmin::text FROM grocery_settings WHERE dgt_id=?",String.class,store);return rows.isEmpty()?"0":rows.getFirst();}
 public record Margin(String key,String version,BigDecimal margin){}
 public record Input(Map<String,Object> settings,List<Margin> margins){}
 private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
 private void validate(Map<String,Object> s){
  if(!s.keySet().equals(FIELDS.keySet()))throw bad("Supply all grocery settings fields");
  var enums=Map.of("defaultTaxType",Set.of("taxable","non_taxable"),"taxRounding",Set.of("standard","round_up","round_down","banker"),"expiredHandling",Set.of("block","warning"),"reorderRule",Set.of("fixed","days_of_stock"));
  for(String key:FIELDS.keySet()){
   Object value=s.get(key);
   if(enums.containsKey(key)){if(!(value instanceof String text)||!enums.get(key).contains(text))throw bad("Invalid "+key);}
   else if(Set.of("alertDays","leadTime","safetyStock").contains(key)){
    if(!(value instanceof Number))throw bad("Enter a number for "+key);
    BigDecimal n;try{n=new BigDecimal(value.toString());}catch(NumberFormatException e){throw bad("Invalid "+key);}
    boolean safety=key.equals("safetyStock");if(n.signum()<0||n.compareTo(BigDecimal.valueOf(safety?1000:3650))>0||n.stripTrailingZeros().scale()>(safety?2:0))throw bad("Invalid "+key);
   }else if(!(value instanceof Boolean))throw bad("Invalid "+key);
  }
 }
 @PutMapping @Transactional public Object save(@PathVariable String store,@RequestHeader(value="If-Match",required=false) String version,@RequestBody Input input){
  access(store);a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);access(store);
  if(input==null||(input.settings()==null&&input.margins()==null))throw bad("No settings supplied");
  var changes=new ArrayList<Map<String,Object>>();
  if(input.settings()!=null){
   validate(input.settings());if(!Objects.equals(version,version(store)))throw new ResponseStatusException(HttpStatus.CONFLICT,"Settings changed; reload before saving");
   var old=settings(store);for(String key:FIELDS.keySet()){Object previous=old==null?null:old.get(key),next=input.settings().get(key);if(!(previous instanceof Number&&next instanceof Number?new BigDecimal(previous.toString()).compareTo(new BigDecimal(next.toString()))==0:Objects.equals(previous,next)))changes.add(change(key,previous,next));}
   if(!changes.isEmpty()){
    var values=new ArrayList<Object>();values.add(store);for(String key:FIELDS.keySet())values.add(input.settings().get(key));values.add(a.user());
    var columns=String.join(",",FIELDS.values());var updates=FIELDS.values().stream().map(c->c+"=EXCLUDED."+c).toList();
    a.db.update("INSERT INTO grocery_settings(dgt_id,"+columns+",updated_by) VALUES ("+String.join(",",Collections.nCopies(values.size(),"?"))+") ON CONFLICT(dgt_id) DO UPDATE SET "+String.join(",",updates)+",updated_by=EXCLUDED.updated_by,updated_at=CURRENT_TIMESTAMP",values.toArray());
   }
  }
  if(input.margins()!=null){
   if(input.margins().size()>5000)throw bad("Too many margins");var seen=new HashSet<String>();
   for(var m:input.margins()){
    if(m==null||m.key()==null||!m.key().matches("[0-9]{1,18}")||!seen.add(m.key()))throw bad("Invalid or duplicate sub-department");
    if(m.margin()!=null&&(m.margin().signum()<0||m.margin().compareTo(BigDecimal.valueOf(100))>=0||m.margin().stripTrailingZeros().scale()>2))throw bad("Margin must be between 0 and 99.99");
    var rows=a.db.queryForList("SELECT s.xmin::text AS version,s.default_margin_percentage AS margin,s.store_sub_department_name AS name FROM store_sub_departments s JOIN store_departments d ON d.store_department_id=s.store_department_id AND d.dgt_id=s.dgt_id WHERE s.dgt_id=? AND s.store_sub_department_id=? AND s.is_active AND d.is_active AND s.source_type<>'UNCLASSIFIED' FOR UPDATE OF s",store,Long.parseLong(m.key()));
    if(rows.size()!=1)throw bad("Sub-department does not belong to this store");var row=rows.getFirst();if(!Objects.equals(m.version(),row.get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Sub-department changed; reload before saving");
    var old=(BigDecimal)row.get("margin");if(old==null?m.margin()!=null:m.margin()==null||old.compareTo(m.margin())!=0){a.db.update("UPDATE store_sub_departments SET default_margin_percentage=?,updated_at=CURRENT_TIMESTAMP WHERE dgt_id=? AND store_sub_department_id=?",m.margin(),store,Long.parseLong(m.key()));changes.add(change("Margin: "+row.get("name")+" (#"+m.key()+")",old,m.margin()));}
   }
  }
  if(!changes.isEmpty())a.audit(store,"GROCERY_SETTINGS_CHANGED",store,json.writeValueAsString(changes));return Map.of("saved",true);
 }
 private Map<String,Object> change(String field,Object from,Object to){var c=new LinkedHashMap<String,Object>();c.put("field",field);c.put("from",from);c.put("to",to);return c;}
}
