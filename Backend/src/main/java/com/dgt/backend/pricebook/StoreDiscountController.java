package com.dgt.backend.pricebook;
import java.util.*;
import java.math.BigDecimal;
import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/discounts")
public class StoreDiscountController {
 private final ScopedAccess a;
 public StoreDiscountController(ScopedAccess a){this.a=a;}
 public record Input(String name,String code,String valueType,BigDecimal value,String appliesTo,boolean managerApproval,boolean allowOnRestricted,boolean allowOnFuel,boolean combinePromotions,BigDecimal dailyCap,boolean active,String eligibilityType,Integer seniorAge){}
 private void access(String store){a.grant(a.user(),store,"PRICE_BOOK",true);}
 private ResponseStatusException bad(String m){return new ResponseStatusException(HttpStatus.BAD_REQUEST,m);}
 @GetMapping public Object list(@PathVariable String store){access(store);
 var reasons=a.db.queryForList("SELECT d.discount_id::text AS id,d.xmin::text AS version,d.name,d.code,t.code AS \"valueType\",d.value,d.applies_to AS \"appliesTo\",d.manager_approval AS \"managerApproval\",d.allow_restricted AS \"allowOnRestricted\",d.allow_fuel AS \"allowOnFuel\",d.combine_promotions AS \"combinePromotions\",d.daily_cap AS \"dailyCap\",d.active,d.eligibility_type AS \"eligibilityType\",d.senior_age AS \"seniorAge\" FROM store_discounts d JOIN discount_type t ON t.discount_type_id=d.discount_type_id WHERE d.dgt_id=? ORDER BY d.name,d.discount_id",store);
 var history=a.db.queryForList("SELECT h.application_id::text AS id,h.applied_at AS date,s.receipt_no AS receipt,h.cashier_name AS cashier,h.reason_name AS reason,h.ticket_total AS \"ticketTotal\",h.discount_amount AS \"discountAmount\",h.approved_by_name AS \"approvedBy\" FROM sale_discount_applications h JOIN sales s ON s.sale_id=h.sale_id AND s.store_id=h.dgt_id WHERE h.dgt_id=? AND h.status='APPLIED' ORDER BY h.applied_at DESC,h.application_id DESC",store);
 return Map.of("reasons",reasons.stream().map(Rows::normalize).toList(),"history",history.stream().map(Rows::normalize).toList(),"discountTypes",a.db.queryForList("SELECT code AS value,name AS label FROM discount_type WHERE is_active AND code IN ('PERCENT','AMOUNT') ORDER BY sort_order"));
 }
 @PostMapping @Transactional public Object create(@PathVariable String store,@RequestBody Input in){return save(store,null,null,in);}
 @PutMapping("/{id}") @Transactional public Object update(@PathVariable String store,@PathVariable long id,@RequestHeader("If-Match") String version,@RequestBody Input in){return save(store,id,version,in);}
 private Object save(String store,Long id,String version,Input in){access(store);
 a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);
 if(in.name()==null||in.name().isBlank()||in.name().trim().length()>150)throw bad("Enter a name of at most 150 characters");
 if(in.code()==null||!in.code().trim().matches("[A-Za-z0-9_-]{1,30}"))throw bad("Code must contain 1–30 letters, numbers, underscores or hyphens");
 String eligibility=in.eligibilityType()==null?"NONE":in.eligibilityType();
 if(!Set.of("NONE","EMPLOYEE","STUDENT","SENIOR","MILITARY").contains(eligibility))throw bad("Choose an eligibility requirement");
 if("SENIOR".equals(eligibility)&&(in.seniorAge()==null||in.seniorAge()<1||in.seniorAge()>120))throw bad("Enter the minimum senior age (1–120)");
 Integer age="SENIOR".equals(eligibility)?in.seniorAge():null;
 String code=in.code().trim().toUpperCase(Locale.ROOT);
 var type=a.db.queryForList("SELECT discount_type_id FROM discount_type WHERE is_active AND code IN ('PERCENT','AMOUNT') AND code=?",in.valueType());
 if(type.size()!=1)throw bad("Choose an active discount type");
 if(in.value()==null||in.value().signum()<=0||in.value().scale()>2||in.value().compareTo(new BigDecimal("9999999999.99"))>0||("PERCENT".equals(in.valueType())&&in.value().compareTo(new BigDecimal("100"))>0))throw bad("Enter a valid discount value; percentage cannot exceed 100");
 if(in.appliesTo()==null||!Set.of("Whole Ticket","Single Item").contains(in.appliesTo()))throw bad("Choose where the discount applies");
 if(in.dailyCap()==null||in.dailyCap().signum()<0||in.dailyCap().scale()>2||in.dailyCap().compareTo(new BigDecimal("9999999999.99"))>0)throw bad("Enter a non-negative daily cap");
 if(!a.db.queryForList("SELECT discount_id FROM store_discounts WHERE dgt_id=? AND code=? AND (?::bigint IS NULL OR discount_id<>?)",store,code,id,id).isEmpty())throw new ResponseStatusException(HttpStatus.CONFLICT,"This discount code already exists in this store");
 if(id==null)id=a.db.queryForObject("INSERT INTO store_discounts(dgt_id,name,code,discount_type_id,value,applies_to,manager_approval,allow_restricted,allow_fuel,combine_promotions,daily_cap,active,eligibility_type,senior_age) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING discount_id",Long.class,store,in.name().trim(),code,type.getFirst().get("discount_type_id"),in.value(),in.appliesTo(),in.managerApproval(),in.allowOnRestricted(),in.allowOnFuel(),in.combinePromotions(),in.dailyCap(),in.active(),eligibility,age);
 else if(a.db.update("UPDATE store_discounts SET name=?,code=?,discount_type_id=?,value=?,applies_to=?,manager_approval=?,allow_restricted=?,allow_fuel=?,combine_promotions=?,daily_cap=?,active=?,eligibility_type=?,senior_age=?,updated_at=now() WHERE discount_id=? AND dgt_id=? AND xmin::text=?",in.name().trim(),code,type.getFirst().get("discount_type_id"),in.value(),in.appliesTo(),in.managerApproval(),in.allowOnRestricted(),in.allowOnFuel(),in.combinePromotions(),in.dailyCap(),in.active(),eligibility,age,id,store,version)!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,"Discount changed or is unavailable; reload and retry");
 a.audit(store,"DISCOUNT_SAVED",id.toString(),"{}");return Map.of("id",id,"saved",true);
 }
}
