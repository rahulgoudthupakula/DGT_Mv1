package com.dgt.backend.pricebook;
import java.util.*;
import java.math.*;
import java.time.*;
import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

/** Open-ticket discount API. Never adjusts tendered or completed sales. */
@Slf4j
@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/checkout-discounts")
public class CheckoutDiscountController {
 private final ScopedAccess a;private final ObjectMapper json;
 public CheckoutDiscountController(ScopedAccess a,ObjectMapper json){this.a=a;this.json=json;}
 public record Input(long saleId,long discountId,List<Long> itemIds,boolean eligibilityConfirmed,Long employeeId){}
 private ResponseStatusException bad(String m){return new ResponseStatusException(HttpStatus.BAD_REQUEST,m);}
 private ResponseStatusException conflict(String m){return new ResponseStatusException(HttpStatus.CONFLICT,m);}
 private BigDecimal n(Object x){return x==null?BigDecimal.ZERO:new BigDecimal(x.toString());}
 private BigDecimal money(BigDecimal x){return x.setScale(2,RoundingMode.HALF_UP);}
 private boolean yes(Object x){return Boolean.TRUE.equals(x);}
 private long id(Object x){return ((Number)x).longValue();}
 private String name(long uid){return a.db.queryForObject("SELECT concat_ws(' ',first_name,last_name) FROM users WHERE user_id=?",String.class,uid);}
 private boolean manager(String store,long uid){try{return Set.of("ADMIN","MANAGER").contains(a.grant(uid,store,"PRICE_BOOK",true).role());}catch(ResponseStatusException e){return false;}}
 private void access(String store){a.assigned(store);if(manager(store,a.user()))return;
 if(!Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM user_roles r JOIN role_types t USING(role_type_id) WHERE r.user_id=? AND r.dgt_id=? AND r.is_active AND t.is_active AND upper(t.role_type_name)='CASHIER')",Boolean.class,a.user(),store)))throw a.denied();}
 private void lock(String store){a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);}
 private LocalDate day(String store){return a.db.queryForObject("SELECT (CURRENT_TIMESTAMP AT TIME ZONE timezone)::date FROM stores WHERE dgt_id=?",LocalDate.class,store);}
 private Map<String,Object> one(String sql,Object... args){var rows=a.db.queryForList(sql,args);if(rows.size()!=1)throw bad("Record is not available in this store");return rows.getFirst();}
 private Map<String,Object> calculate(String store,Input in,Long existing){
 var sale=one("SELECT * FROM sales WHERE sale_id=? AND store_id=? FOR UPDATE",in.saleId(),store);
 if(!manager(store,a.user())&&!Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM employees WHERE employee_id=? AND user_id=?)",Boolean.class,sale.get("cashier_id"),a.user())))throw a.denied();
 if(!"OPEN".equals(sale.get("sale_status"))||!"SALE".equals(sale.get("transaction_type")))throw conflict("Discounts apply only to open sales");
 if(!a.db.queryForList("SELECT sale_payment_id FROM sale_payments WHERE sale_id=?",in.saleId()).isEmpty())throw conflict("Remove/cancel tendering before applying a discount");
 if(!a.db.queryForList("SELECT application_id FROM sale_discount_applications WHERE sale_id=? AND status IN ('PENDING','APPLIED') AND (?::bigint IS NULL OR application_id<>?)",in.saleId(),existing,existing).isEmpty())throw conflict("This sale already has a register discount or pending request");
 var d=one("SELECT d.*,d.xmin::text AS revision,t.code AS type FROM store_discounts d JOIN discount_type t USING(discount_type_id) WHERE d.discount_id=? AND d.dgt_id=? AND d.active AND t.is_active",in.discountId(),store);
 String eligibility=d.get("eligibility_type").toString();Long employeeUser=null;
 if(!eligibility.equals("NONE")&&!in.eligibilityConfirmed())throw bad("Confirm the required eligibility check first");
 if(eligibility.equals("EMPLOYEE")){
 if(in.employeeId()==null)throw bad("Select an active employee of this store");
 var e=one("SELECT e.* FROM employees e WHERE e.employee_id=? AND (e.hire_date IS NULL OR e.hire_date<=?) AND (e.termination_date IS NULL OR e.termination_date>?) AND EXISTS(SELECT 1 FROM employee_store_assignments s WHERE s.employee_id=e.employee_id AND s.dgt_id=? AND s.effective_from<=? AND (s.effective_to IS NULL OR s.effective_to>=?))",in.employeeId(),day(store),day(store),store,day(store),day(store));
 if(e.get("user_id")!=null)employeeUser=id(e.get("user_id"));
 }else if(in.employeeId()!=null)throw bad("Employee selection applies only to employee discounts");
 var items=a.db.queryForList("SELECT i.*,p.is_age_restricted,p.is_taxable,p.unit_of_measure AS product_unit,(SELECT d.store_department_name FROM store_sub_departments sub JOIN store_departments d ON d.store_department_id=sub.store_department_id AND d.dgt_id=sub.dgt_id WHERE sub.store_sub_department_id=p.store_sub_department_id AND sub.dgt_id=p.dgt_id) AS department_name FROM sales_items i JOIN products p ON p.product_id=i.product_id AND p.dgt_id=? WHERE i.sale_id=? ORDER BY i.sales_item_id FOR UPDATE OF i",store,in.saleId());
 if(items.isEmpty())throw bad("Sale has no eligible product lines");
 if(a.db.queryForObject("SELECT count(*) FROM sales_items WHERE sale_id=?",Integer.class,in.saleId())!=items.size())throw bad("Sale contains items outside this store");
 Set<Long> selected=new HashSet<>(in.itemIds()==null?List.of():in.itemIds());
 if(in.itemIds()!=null&&selected.size()!=in.itemIds().size())throw bad("Select each item only once");
 if("Single Item".equals(d.get("applies_to"))&&selected.size()!=1)throw bad("Select one sale line");
 if("Whole Ticket".equals(d.get("applies_to"))&&!selected.isEmpty())throw bad("Whole-ticket discounts select eligible lines automatically");
 if(!selected.isEmpty()&&items.stream().noneMatch(i->selected.contains(id(i.get("sales_item_id")))))throw bad("Selected line is not on this sale");
 BigDecimal base=BigDecimal.ZERO,oldDiscount=BigDecimal.ZERO;List<Map<String,Object>> eligible=new ArrayList<>();
 for(var i:items){
 BigDecimal gross=n(i.get("gross_amount")),discount=n(i.get("discount_amount")),net=gross.subtract(discount),tax=n(i.get("tax_amount"));
 if(n(i.get("quantity")).signum()<=0||gross.signum()<0||discount.signum()<0||net.signum()<0||tax.signum()<0||money(net.add(tax)).compareTo(money(n(i.get("line_total"))))!=0)throw bad("Sale line totals are inconsistent or unsupported");
 oldDiscount=oldDiscount.add(discount);
 boolean fuel=Set.of("GAL","GALLON","GALLONS").contains(String.valueOf(i.get("product_unit")).toUpperCase(Locale.ROOT))||Set.of("GAS","FUEL","GASOLINE","DIESEL").contains(String.valueOf(i.get("department_name")).toUpperCase(Locale.ROOT));
 boolean allowed=(!yes(i.get("is_age_restricted"))||yes(d.get("allow_restricted")))&&(!fuel||yes(d.get("allow_fuel")));
 if(!selected.isEmpty()&&selected.contains(id(i.get("sales_item_id")))&&!allowed)throw bad("The selected item is excluded by this discount");
 if(allowed&&(selected.isEmpty()||selected.contains(id(i.get("sales_item_id"))))&&net.signum()>0){eligible.add(i);base=base.add(net);}
 }
 for(String field:List.of("taxable_amount","tax_amount","total_amount","subtotal")){
 BigDecimal sum=BigDecimal.ZERO;for(var i:items)sum=sum.add(field.equals("total_amount")?n(i.get("line_total")):field.equals("subtotal")?n(i.get("gross_amount")).subtract(n(i.get("discount_amount"))):n(i.get(field)));
 if(money(sum).compareTo(money(n(sale.get(field))))!=0)throw bad("Receipt totals do not match its lines; recalculate the open sale first");
 }
 if(oldDiscount.compareTo(n(sale.get("discount_amount")))!=0)throw bad("Receipt discounts must be allocated to lines before applying a register discount");
 if(oldDiscount.signum()>0&&!yes(d.get("combine_promotions")))throw bad("This discount cannot combine with existing discounts or promotions");
 if(base.signum()<=0)throw bad("No eligible amount to discount");
 String type=d.get("type").toString();if(!Set.of("PERCENT","AMOUNT").contains(type))throw bad("Unsupported register discount type");
 BigDecimal amount=money(type.equals("PERCENT")?base.multiply(n(d.get("value"))).divide(new BigDecimal("100")):n(d.get("value"))).min(base);
 if(amount.signum()<=0)throw bad("Discount rounds to zero");
 BigDecimal cap=n(d.get("daily_cap"));BigDecimal used=a.db.queryForObject("SELECT coalesce(sum(discount_amount),0) FROM sale_discount_applications WHERE dgt_id=? AND discount_id=? AND status='APPLIED' AND business_date=?",BigDecimal.class,store,in.discountId(),day(store));
 if(cap.signum()>0&&used.add(amount).compareTo(cap)>0)throw conflict("Store daily cap for this discount would be exceeded");
 // Allocate cents cumulatively so the sum is exact, even for tiny line values.
 var changes=new ArrayList<Map<String,Object>>();BigDecimal cumulative=BigDecimal.ZERO,allocated=BigDecimal.ZERO;
 for(var i:eligible){BigDecimal net=n(i.get("gross_amount")).subtract(n(i.get("discount_amount")));cumulative=cumulative.add(net);BigDecimal next=money(amount.multiply(cumulative).divide(base,12,RoundingMode.HALF_UP));BigDecimal part=next.subtract(allocated);allocated=next;
 BigDecimal after=net.subtract(part),taxBase=n(i.get("taxable_amount")),tax=n(i.get("tax_amount"));
 if(taxBase.signum()>0&&taxBase.compareTo(net)!=0||tax.signum()>0&&taxBase.signum()==0)throw bad("This line requires POS-specific tax calculation");
 BigDecimal newTax=tax.signum()==0?BigDecimal.ZERO:money(tax.multiply(after).divide(net,12,RoundingMode.HALF_UP));
 changes.add(Map.of("id",i.get("sales_item_id"),"discount",n(i.get("discount_amount")).add(part),"taxable",taxBase.signum()>0?after:BigDecimal.ZERO,"tax",newTax,"total",after.add(newTax),"applied",part));
 }
 var result=new LinkedHashMap<String,Object>();result.put("amount",amount);result.put("lines",changes);result.put("before",items);result.put("sale",sale);result.put("revision",d.get("revision"));result.put("reason",d.get("name"));result.put("eligibility",eligibility);result.put("employeeUser",employeeUser);result.put("requiresApproval",yes(d.get("manager_approval"))||Objects.equals(employeeUser,a.user())||in.employeeId()!=null&&Objects.equals(in.employeeId(),sale.get("cashier_id")));result.put("businessDate",day(store).toString());return result;
 }
 @GetMapping("/options") public Object options(@PathVariable String store){access(store);return Map.of("discounts",a.db.queryForList("SELECT discount_id,name,eligibility_type,senior_age,applies_to,manager_approval FROM store_discounts WHERE dgt_id=? AND active ORDER BY name",store),"employees",a.db.queryForList("SELECT e.employee_id,coalesce(e.first_name,u.first_name) AS first_name,coalesce(e.last_name,u.last_name) AS last_name FROM employees e LEFT JOIN users u ON u.user_id=e.user_id WHERE (e.hire_date IS NULL OR e.hire_date<=?) AND (e.termination_date IS NULL OR e.termination_date>?) AND EXISTS(SELECT 1 FROM employee_store_assignments s WHERE s.employee_id=e.employee_id AND s.dgt_id=? AND s.effective_from<=? AND (s.effective_to IS NULL OR s.effective_to>=?)) ORDER BY e.employee_id",day(store),day(store),store,day(store),day(store)));}
 @PostMapping("/preview") @Transactional public Object preview(@PathVariable String store,@RequestBody Input in){access(store);lock(store);var c=calculate(store,in,null);return Map.of("amount",c.get("amount"),"lines",c.get("lines"),"requiresApproval",c.get("requiresApproval"),"eligibility",c.get("eligibility"));}
 @PostMapping @Transactional public Object apply(@PathVariable String store,@RequestBody Input in,@RequestHeader("Idempotency-Key") UUID key){access(store);lock(store);
 String payload=json.writeValueAsString(in);var old=a.db.queryForList("SELECT application_id,status,request_payload,confirmed_by FROM sale_discount_applications WHERE dgt_id=? AND request_key=?",store,key);
 if(!old.isEmpty()){var r=old.getFirst();if(id(r.get("confirmed_by"))!=a.user())throw a.denied();if(!json.readTree(r.get("request_payload").toString()).equals(json.readTree(payload)))throw conflict("Request key reused with different details");return Map.of("id",r.get("application_id"),"status",r.get("status"));}
 var c=calculate(store,in,null);boolean pending=yes(c.get("requiresApproval"));
 long id=a.db.queryForObject("INSERT INTO sale_discount_applications(dgt_id,discount_id,sale_id,reason_name,cashier_name,ticket_total,discount_amount,status,request_key,request_payload,calculation,confirmed_by,confirmed_at,employee_id,eligibility_type,business_date) VALUES (?,?,?,?,?,?,?, ?,?,CAST(? AS jsonb),CAST(? AS jsonb),?,now(),?,?,?) RETURNING application_id",Long.class,store,in.discountId(),in.saleId(),c.get("reason"),name(a.user()),n(((Map<?,?>)c.get("sale")).get("total_amount")),c.get("amount"),pending?"PENDING":"APPLIED",key,payload,json.writeValueAsString(c),a.user(),in.employeeId(),c.get("eligibility"),day(store));
 if(!pending)write(in.saleId(),c);a.audit(store,pending?"DISCOUNT_REQUESTED":"DISCOUNT_APPLIED",Long.toString(id),payload);return Map.of("id",id,"status",pending?"PENDING":"APPLIED");
 }
 @SuppressWarnings("unchecked") private void write(long sale,Map<String,Object> c){for(var l:(List<Map<String,Object>>)c.get("lines"))a.db.update("UPDATE sales_items SET discount_amount=?,taxable_amount=?,tax_amount=?,line_total=? WHERE sales_item_id=? AND sale_id=?",l.get("discount"),l.get("taxable"),l.get("tax"),l.get("total"),l.get("id"),sale);
 a.db.update("UPDATE sales SET subtotal=v.net,discount_amount=v.discount,taxable_amount=v.taxable,tax_amount=v.tax,total_amount=v.total,updated_at=now() FROM (SELECT sum(gross_amount-discount_amount) net,sum(discount_amount) discount,sum(taxable_amount) taxable,sum(tax_amount) tax,sum(line_total) total FROM sales_items WHERE sale_id=?) v WHERE sales.sale_id=?",sale,sale);
 }
 @GetMapping("/requests") public Object requests(@PathVariable String store){access(store);if(!manager(store,a.user()))throw a.denied();return a.db.queryForList("SELECT application_id,reason_name,cashier_name,sale_id,discount_amount,eligibility_type,employee_id,confirmed_at FROM sale_discount_applications WHERE dgt_id=? AND status='PENDING' ORDER BY application_id",store).stream().map(Rows::normalize).toList();}
 @PostMapping("/{id}/approve") @Transactional public Object approve(@PathVariable String store,@PathVariable long id){access(store);if(!manager(store,a.user()))throw a.denied();lock(store);
 var r=one("SELECT * FROM sale_discount_applications WHERE application_id=? AND dgt_id=? FOR UPDATE",id,store);
 if("APPLIED".equals(r.get("status")))return Map.of("id",id,"status","APPLIED");if(!"PENDING".equals(r.get("status")))throw conflict("Request is no longer pending");
 if(id(r.get("confirmed_by"))==a.user())throw a.denied();
 Input in=json.readValue(r.get("request_payload").toString(),Input.class);var c=calculate(store,in,id);
 if(Objects.equals(c.get("employeeUser"),a.user()))throw a.denied();
 var previous=json.readTree(r.get("calculation").toString());var current=json.readTree(json.writeValueAsString(c));
 for(String field:List.of("before","sale","revision","amount","businessDate","employeeUser"))if(!Objects.equals(previous.get(field),current.get(field)))throw conflict("Sale, eligibility or discount changed; reject and submit a fresh request");
 write(in.saleId(),c);a.db.update("UPDATE sale_discount_applications SET status='APPLIED',approved_by=?,approved_by_name=?,reviewed_at=now(),applied_at=now() WHERE application_id=?",a.user(),name(a.user()),id);a.audit(store,"DISCOUNT_APPROVED",Long.toString(id),"{}");return Map.of("id",id,"status","APPLIED");
 }
 @PostMapping("/{id}/reject") @Transactional public Object reject(@PathVariable String store,@PathVariable long id){access(store);lock(store);var r=one("SELECT * FROM sale_discount_applications WHERE application_id=? AND dgt_id=? FOR UPDATE",id,store);if(!manager(store,a.user())&&id(r.get("confirmed_by"))!=a.user())throw a.denied();if(!"PENDING".equals(r.get("status")))throw conflict("Request is no longer pending");a.db.update("UPDATE sale_discount_applications SET status='REJECTED',approved_by=?,reviewed_at=now() WHERE application_id=?",a.user(),id);a.audit(store,"DISCOUNT_REJECTED",Long.toString(id),"{}");return Map.of("status","REJECTED");}
}
