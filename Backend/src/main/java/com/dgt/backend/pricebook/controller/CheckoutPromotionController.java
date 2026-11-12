package com.dgt.backend.pricebook.controller;

import java.util.*;
import java.math.*;
import java.security.*;
import java.nio.charset.StandardCharsets;
import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.pricebook.service.PromotionPricing;
import com.dgt.backend.pricebook.service.PromotionPricing.*;
import com.dgt.backend.common.entity.Rows;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

/** Applies best-price promotions only to an authorized, unpaid, undiscounted open ticket. */
@RestController
@ConditionalOnProperty(name="app.pricebook.enabled",havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/checkout-promotions")
public class CheckoutPromotionController {
 private final ScopedAccess a;private final ObjectMapper json;
 public CheckoutPromotionController(ScopedAccess a,ObjectMapper json){this.a=a;this.json=json;}
 public record Input(long saleId,String quoteVersion){}
 private ResponseStatusException bad(String m){return new ResponseStatusException(HttpStatus.CONFLICT,m);}
 private BigDecimal n(Object v){return v==null?BigDecimal.ZERO:new BigDecimal(v.toString());}
 private BigDecimal money(BigDecimal v){return v.setScale(2,RoundingMode.HALF_UP);}
 private long id(Object v){return ((Number)v).longValue();}
 private boolean manager(String store){try{return Set.of("ADMIN","MANAGER").contains(a.grant(a.user(),store,"PRICE_BOOK",true).role());}catch(ResponseStatusException e){return false;}}
 private void access(String store){a.assigned(store);if(manager(store))return;
  if(!Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM user_roles r JOIN role_types t USING(role_type_id) WHERE r.user_id=? AND r.dgt_id=? AND r.is_active AND t.is_active AND upper(t.role_type_name)='CASHIER')",Boolean.class,a.user(),store)))throw a.denied();
 }
 private void lock(String store){a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);}
 private Map<String,Object> sale(String store,long sale){
  var rows=a.db.queryForList("SELECT *,xmin::text AS revision FROM sales WHERE sale_id=? AND store_id=? FOR UPDATE",sale,store);
  if(rows.size()!=1)throw bad("Sale is not available in this store");var row=rows.getFirst();
  if(!manager(store)&&!Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM employees WHERE employee_id=? AND user_id=?)",Boolean.class,row.get("cashier_id"),a.user())))throw a.denied();
  return row;
 }
 private Map<String,Object> calculate(String store,Input in,Map<String,Object> sale){
  if(!"OPEN".equals(sale.get("sale_status"))||!"SALE".equals(sale.get("transaction_type")))throw bad("Promotions apply only to open sales");
  if(!a.db.queryForList("SELECT sale_payment_id FROM sale_payments WHERE sale_id=?",in.saleId()).isEmpty())throw bad("Remove/cancel tendering before pricing promotions");
  if(!a.db.queryForList("SELECT application_id FROM sale_promotion_applications WHERE sale_id=?",in.saleId()).isEmpty())throw bad("Promotions have already been applied to this ticket");
  if(!a.db.queryForList("SELECT application_id FROM sale_discount_applications WHERE sale_id=? AND status IN ('PENDING','APPLIED')",in.saleId()).isEmpty())throw bad("Price promotions before adding a register discount");
  var items=a.db.queryForList("SELECT i.*,i.xmin::text AS revision,p.is_active FROM sales_items i JOIN products p ON p.product_id=i.product_id AND p.dgt_id=? WHERE i.sale_id=? ORDER BY i.sales_item_id FOR UPDATE OF i",store,in.saleId());
  if(items.isEmpty()||items.size()!=a.db.queryForObject("SELECT count(*) FROM sales_items WHERE sale_id=?",Integer.class,in.saleId()))throw bad("Sale must contain product lines belonging to this store");
  var lines=new ArrayList<Line>();BigDecimal gross=BigDecimal.ZERO,tax=BigDecimal.ZERO,taxable=BigDecimal.ZERO;
  for(var i:items){
   BigDecimal g=n(i.get("gross_amount")),t=n(i.get("tax_amount")),base=n(i.get("taxable_amount"));
   if(n(i.get("discount_amount")).signum()!=0)throw bad("Existing line discounts cannot be stacked with promotion pricing");
   if(!Boolean.TRUE.equals(i.get("is_active")))throw bad("Sale contains an inactive product");
   if(g.signum()<0||t.signum()<0||base.signum()<0||money(n(i.get("unit_price")).multiply(n(i.get("quantity")))).compareTo(g)!=0||g.add(t).compareTo(n(i.get("line_total")))!=0)throw bad("Sale line totals do not reconcile");
   if(base.signum()>0&&base.compareTo(g)!=0||t.signum()>0&&base.signum()==0)throw bad("This ticket requires POS-specific tax calculation");
   lines.add(new Line(id(i.get("sales_item_id")),id(i.get("product_id")),n(i.get("quantity")),n(i.get("unit_price"))));gross=gross.add(g);tax=tax.add(t);taxable=taxable.add(base);
  }
  if(gross.compareTo(n(sale.get("subtotal")))!=0||tax.compareTo(n(sale.get("tax_amount")))!=0||taxable.compareTo(n(sale.get("taxable_amount")))!=0||gross.add(tax).compareTo(n(sale.get("total_amount")))!=0||n(sale.get("discount_amount")).signum()!=0)throw bad("Receipt totals do not match its lines");
  var raw=a.db.queryForList("SELECT p.*,p.xmin::text AS revision FROM promotions p JOIN discount_type d ON d.promotion_value=p.promotion_type AND d.is_active WHERE p.dgt_id=? AND p.is_active AND CURRENT_TIMESTAMP BETWEEN p.start_date AND p.end_date AND EXISTS(SELECT 1 FROM promotion_products pp JOIN sales_items si ON si.product_id=pp.product_id WHERE pp.promotion_id=p.promotion_id AND pp.dgt_id=p.dgt_id AND pp.archived_at IS NULL AND si.sale_id=?) ORDER BY p.promotion_id",store,in.saleId());
  var linkArgs=new ArrayList<Object>();linkArgs.add(store);raw.forEach(p->linkArgs.add(p.get("promotion_id")));
  List<Map<String,Object>> links=raw.isEmpty()?List.of():a.db.queryForList("SELECT pp.promotion_id,pp.product_id,pp.required_quantity,pr.is_active FROM promotion_products pp JOIN products pr ON pr.product_id=pp.product_id AND pr.dgt_id=pp.dgt_id WHERE pp.dgt_id=? AND pp.archived_at IS NULL AND pp.promotion_id IN ("+String.join(",",Collections.nCopies(raw.size(),"?"))+") ORDER BY pp.promotion_id,pp.product_id",linkArgs.toArray());
  var offers=new ArrayList<Offer>();
  for(var p:raw){var products=new LinkedHashMap<Long,Integer>();boolean active=true;for(var l:links)if(id(l.get("promotion_id"))==id(p.get("promotion_id"))){products.put(id(l.get("product_id")),n(l.get("required_quantity")).intValueExact());active&=Boolean.TRUE.equals(l.get("is_active"));}
   if(active&&!products.isEmpty())offers.add(new Offer(id(p.get("promotion_id")),p.get("promotion_name").toString(),p.get("promotion_type").toString(),n(p.get("discount_value")),n(p.get("buy_quantity")).intValueExact(),n(p.get("free_quantity")).intValueExact(),products));
  }
  Quote priced=PromotionPricing.price(lines,offers);var changes=new ArrayList<Map<String,Object>>();BigDecimal newTax=BigDecimal.ZERO,newTaxable=BigDecimal.ZERO;
  for(int x=0;x<items.size();x++){
   var old=items.get(x);var line=priced.lines().get(x);BigDecimal t=n(old.get("tax_amount"));BigDecimal afterTax=t.signum()==0?BigDecimal.ZERO:money(t.multiply(line.net()).divide(line.gross(),12,RoundingMode.HALF_UP));BigDecimal base=n(old.get("taxable_amount")).signum()>0?line.net():BigDecimal.ZERO;
   changes.add(Map.of("lineId",line.lineId(),"gross",line.gross(),"discount",line.discount(),"net",line.net(),"taxable",base,"tax",afterTax,"total",line.net().add(afterTax),"promotions",line.promotions()));newTax=newTax.add(afterTax);newTaxable=newTaxable.add(base);
  }
  String fingerprint=json.writeValueAsString(Map.of("sale",Rows.normalize(sale),"items",items.stream().map(Rows::normalize).toList(),"offers",offers));
  String version;try{version=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(fingerprint.getBytes(StandardCharsets.UTF_8)));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}
  return Map.of("saleId",in.saleId(),"quoteVersion",version,"gross",priced.gross(),"discount",priced.discount(),"net",priced.net(),"taxable",newTaxable,"tax",newTax,"total",priced.net().add(newTax),"lines",changes);
 }
 @PostMapping("/preview") @Transactional public Object preview(@PathVariable String store,@RequestBody Input in){access(store);lock(store);return calculate(store,in,sale(store,in.saleId()));}
 @PostMapping @Transactional public Object apply(@PathVariable String store,@RequestBody Input in,@RequestHeader("Idempotency-Key") UUID key){
  access(store);lock(store);var sale=sale(store,in.saleId());
  var old=a.db.queryForList("SELECT * FROM sale_promotion_applications WHERE dgt_id=? AND request_key=?",store,key);
  if(!old.isEmpty()){var r=old.getFirst();if(id(r.get("applied_by"))!=a.user())throw a.denied();if(id(r.get("sale_id"))!=in.saleId()||!Objects.equals(r.get("quote_version"),in.quoteVersion()))throw bad("Idempotency key reused with different promotion details");return json.readTree(r.get("calculation").toString());}
  var quote=calculate(store,in,sale);if(!Objects.equals(quote.get("quoteVersion"),in.quoteVersion()))throw bad("Ticket or promotions changed; preview again before applying");
  @SuppressWarnings("unchecked") var changes=(List<Map<String,Object>>)quote.get("lines");
  for(var l:changes)a.db.update("UPDATE sales_items SET discount_amount=?,taxable_amount=?,tax_amount=?,line_total=? WHERE sales_item_id=? AND sale_id=?",l.get("discount"),l.get("taxable"),l.get("tax"),l.get("total"),l.get("lineId"),in.saleId());
  a.db.update("UPDATE sales SET subtotal=?,discount_amount=?,taxable_amount=?,tax_amount=?,total_amount=?,updated_at=now() WHERE sale_id=? AND store_id=?",quote.get("net"),quote.get("discount"),quote.get("taxable"),quote.get("tax"),quote.get("total"),in.saleId(),store);
  a.db.update("INSERT INTO sale_promotion_applications(dgt_id,sale_id,request_key,applied_by,quote_version,calculation) VALUES (?,?,?,?,?,CAST(? AS jsonb))",store,in.saleId(),key,a.user(),in.quoteVersion(),json.writeValueAsString(quote));
  a.audit(store,"PROMOTIONS_APPLIED",Long.toString(in.saleId()),json.writeValueAsString(quote));return quote;
 }
}
