package com.dgt.backend.lottery.controller;
import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import java.math.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/v1/access/stores/{store}/lottery-closing")
public class LotteryClosingController {
 private final ScopedAccess a;private final LotteryDeliveryController permissions;private final ObjectMapper json;
 public LotteryClosingController(ScopedAccess a,LotteryDeliveryController permissions,ObjectMapper json){this.a=a;this.permissions=permissions;this.json=json;}
 private void access(String store,String code){if(!permissions.allowed(store,code))throw a.denied();}
 private ResponseStatusException bad(String m){return new ResponseStatusException(HttpStatus.BAD_REQUEST,m);}
 private ResponseStatusException conflict(String m){return new ResponseStatusException(HttpStatus.CONFLICT,m);}
 private Map<String,Object> lock(String store){return a.db.queryForMap("SELECT *,xmin::text AS version FROM stores WHERE dgt_id=? FOR UPDATE",store);}
 @GetMapping("/settings") public Object settings(@PathVariable String store){access(store,"LOTTERY_SETTINGS");return a.db.queryForMap("SELECT lottery_separate_counter AS \"separateCounter\",xmin::text AS version FROM stores WHERE dgt_id=?",store);}
 public record Setting(Boolean separateCounter,String version){}
 @PutMapping("/settings") @Transactional public Object setting(@PathVariable String store,@RequestBody Setting in){access(store,"LOTTERY_SETTINGS");var old=lock(store);if(in.separateCounter()==null)throw bad("Choose shared or separate counter");if(!Objects.equals(old.get("version"),in.version()))throw conflict("Settings changed; refresh before saving");
  a.db.update("UPDATE stores SET lottery_separate_counter=? WHERE dgt_id=?",in.separateCounter(),store);a.audit(store,"LOTTERY_COUNTER_SETTING",store,json.writeValueAsString(Map.of("separateCounter",in.separateCounter())));return settings(store);}
 private List<Map<String,Object>> eligible(String store){return a.db.queryForList("""
 SELECT p.lottery_pack_id AS id,g.game_name AS "gameName",p.pack_number AS "packNumber",p.start_ticket_number AS "startTicket",p.end_ticket_number AS "endTicket",
 greatest(p.start_ticket_number,coalesce(prev.last_sold+1,p.start_ticket_number)) AS opening,p.received_ticket_price AS price,CASE WHEN g.commission_effective_date<=(SELECT (CURRENT_TIMESTAMP AT TIME ZONE timezone)::date FROM stores WHERE dgt_id=p.dgt_id) THEN g.scheduled_commission_percent ELSE g.commission_percent END AS rate
 FROM lottery_packs p JOIN lottery_games g ON g.lottery_game_id=p.lottery_game_id AND g.dgt_id=p.dgt_id
 LEFT JOIN LATERAL(SELECT max(i.last_sold_ticket_number) AS last_sold FROM lottery_pack_inventory_items i JOIN lottery_pack_inventory c USING(lottery_pack_inventory_id) WHERE i.pack_id=p.lottery_pack_id AND c.dgt_id=p.dgt_id AND c.shift_closed_at IS NOT NULL)prev ON true
 WHERE p.dgt_id=? AND p.activation_reference IS NOT NULL AND p.verification_status='VERIFIED' AND p.return_date IS NULL AND p.return_status IS NULL AND p.pack_settlement_reference IS NULL
 AND greatest(p.start_ticket_number,coalesce(prev.last_sold+1,p.start_ticket_number))<=p.end_ticket_number ORDER BY p.lottery_pack_id
 """,store);}
 private Object data(String store,Long closingId){
  var out=new LinkedHashMap<String,Object>();var storeData=a.db.queryForMap("SELECT store_name AS name,timezone,lottery_separate_counter AS \"separateCounter\",(CURRENT_TIMESTAMP AT TIME ZONE timezone)::date::text AS today FROM stores WHERE dgt_id=?",store);out.put("store",storeData);
  var headers=a.db.queryForList("SELECT c.*,c.xmin::text AS version,concat_ws(' ',u.first_name,u.last_name) AS \"openedBy\",concat_ws(' ',v.first_name,v.last_name) AS \"closedBy\" FROM lottery_pack_inventory c JOIN users u ON u.user_id=c.shift_opened_by LEFT JOIN users v ON v.user_id=c.shift_closed_by WHERE c.dgt_id=? AND c.business_date IS NOT NULL "+(closingId==null?"AND c.shift_closed_at IS NULL":"AND c.lottery_pack_inventory_id=?")+" ORDER BY c.lottery_pack_inventory_id DESC",closingId==null?new Object[]{store}:new Object[]{store,closingId});
  if(closingId!=null&&headers.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Closing not found");
  out.put("closing",headers.isEmpty()?null:Rows.normalize(headers.getFirst()));
  if(headers.isEmpty())out.put("packs",eligible(store).stream().map(Rows::normalize).toList());else out.put("packs",a.db.queryForList("SELECT i.pack_id AS id,g.game_name AS \"gameName\",p.pack_number AS \"packNumber\",p.start_ticket_number AS \"startTicket\",i.open_ticket_number AS opening,i.end_ticket_snapshot AS \"endTicket\",i.last_sold_ticket_number AS \"lastSold\",i.ticket_price_snapshot AS price,i.commission_percent_snapshot AS rate,i.expected_cash AS sales,i.commission_amount AS commission,coalesce(i.recorded_sales_snapshot,(SELECT coalesce(sum(si.quantity),0)::integer FROM lottery_sales_links l JOIN sales_items si USING(sales_item_id) JOIN sales sale ON sale.sale_id=si.sale_id WHERE l.active AND l.lottery_pack_inventory_id=i.lottery_pack_inventory_id AND l.pack_id=i.pack_id AND sale.store_id=p.dgt_id AND sale.transaction_type='SALE' AND sale.sale_status='COMPLETED')) AS \"recordedTickets\" FROM lottery_pack_inventory_items i JOIN lottery_packs p ON p.lottery_pack_id=i.pack_id JOIN lottery_games g ON g.lottery_game_id=p.lottery_game_id WHERE i.lottery_pack_inventory_id=? AND p.dgt_id=? ORDER BY i.pack_id",headers.getFirst().get("lottery_pack_inventory_id"),store).stream().map(Rows::normalize).toList());
  out.put("history",a.db.queryForList("SELECT lottery_pack_inventory_id AS id,business_date::text AS date,closing_type AS type FROM lottery_pack_inventory WHERE dgt_id=? AND business_date IS NOT NULL AND shift_closed_at IS NOT NULL ORDER BY lottery_pack_inventory_id DESC LIMIT 100",store));return out;
 }
 @GetMapping @Transactional(readOnly=true) public Object get(@PathVariable String store,@RequestParam(required=false) Long closingId){access(store,"LOTTERY_CLOSE_SHIFT");return data(store,closingId);}
 public record Open(String type){}
 @PostMapping("/open") @Transactional public Object open(@PathVariable String store,@RequestBody Open in){access(store,"LOTTERY_CLOSE_SHIFT");var settings=lock(store);
  if(settings.get("lottery_separate_counter")==null)throw bad("Choose shared or separate counter in Lottery Settings first");if(!Set.of("DAY","SHIFT").contains(Objects.toString(in.type(),"")))throw bad("Choose day or shift");
  if(!a.db.queryForList("SELECT lottery_pack_inventory_id FROM lottery_pack_inventory WHERE dgt_id=? AND shift_closed_at IS NULL",store).isEmpty())throw conflict("An open closing already exists; refresh or review the legacy closing");
  var packs=eligible(store);if(packs.isEmpty())throw bad("No activated packs with remaining tickets");
  long id=a.db.queryForObject("INSERT INTO lottery_pack_inventory(dgt_id,shift_opened_by,shift_opened_at,business_date,closing_type,counter_separate) VALUES (?,?,CURRENT_TIMESTAMP,(CURRENT_TIMESTAMP AT TIME ZONE ?)::date,?,?) RETURNING lottery_pack_inventory_id",Long.class,store,a.user(),settings.get("timezone"),in.type(),settings.get("lottery_separate_counter"));
  a.db.update("UPDATE lottery_pack_inventory SET sales_period_started_at=coalesce((SELECT max(shift_closed_at) FROM lottery_pack_inventory WHERE dgt_id=? AND lottery_pack_inventory_id<>?),business_date::timestamp AT TIME ZONE ?) WHERE lottery_pack_inventory_id=?",store,id,settings.get("timezone"),id);
  for(var p:packs){if(p.get("price")==null||p.get("rate")==null)throw bad("Pack price or commission is missing");
   a.db.update("INSERT INTO lottery_pack_inventory_items(lottery_pack_inventory_id,pack_id,open_ticket_number,end_ticket_snapshot,physical_quantity,ticket_price_snapshot,commission_percent_snapshot) VALUES (?,?,?,?,?,?,?)",id,p.get("id"),p.get("opening"),p.get("endTicket"),((Number)p.get("endTicket")).intValue()-((Number)p.get("opening")).intValue()+1,p.get("price"),p.get("rate"));}
  a.audit(store,"LOTTERY_CLOSING_OPENED",Long.toString(id),json.writeValueAsString(Map.of("type",in.type(),"separateCounter",settings.get("lottery_separate_counter"))));return data(store,id);
 }
 public record Link(Long salesItemId,Long packId){}
 @GetMapping("/{id}/sales") public Object sales(@PathVariable String store,@PathVariable long id,@RequestParam(defaultValue="") String receipt){
  access(store,"LOTTERY_CLOSE_SHIFT");
  if(a.db.queryForObject("SELECT count(*) FROM lottery_pack_inventory WHERE lottery_pack_inventory_id=? AND dgt_id=?",Integer.class,id,store)!=1)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Closing not found");
  return a.db.queryForList("""
   SELECT si.sales_item_id AS id,s.receipt_no AS receipt,s.sale_datetime AS "soldAt",p.product_name AS product,si.quantity,
    l.pack_id AS "packId",l.lottery_pack_inventory_id AS "closingId"
   FROM sales s JOIN sales_items si USING(sale_id) JOIN products p ON p.product_id=si.product_id AND p.dgt_id=s.store_id
   LEFT JOIN lottery_sales_links l ON l.sales_item_id=si.sales_item_id AND l.active
   WHERE s.store_id=?
    AND (l.lottery_pack_inventory_id=? OR (s.transaction_type='SALE' AND s.sale_status='COMPLETED'
    AND si.quantity>0 AND si.quantity=trunc(si.quantity) AND si.quantity<=2147483647
    AND ?<>'' AND s.receipt_no=? AND l.sales_item_id IS NULL))
   ORDER BY s.sale_datetime,si.sales_item_id LIMIT 200
   """,store,id,receipt,receipt).stream().map(Rows::normalize).toList();
 }
 @PutMapping("/{id}/sales") @Transactional public Object link(@PathVariable String store,@PathVariable long id,@RequestBody Link in){
  access(store,"LOTTERY_CLOSE_SHIFT");lock(store);
  var h=a.db.queryForList("SELECT * FROM lottery_pack_inventory WHERE lottery_pack_inventory_id=? AND dgt_id=? AND shift_closed_at IS NULL FOR UPDATE",id,store);
  if(h.isEmpty())throw conflict("Closing not found or already closed");
  if(in.salesItemId()==null||in.packId()==null)throw bad("Choose a receipt line and a pack");
  if(a.db.queryForObject("SELECT count(*) FROM lottery_pack_inventory_items WHERE lottery_pack_inventory_id=? AND pack_id=?",Integer.class,id,in.packId())!=1)throw bad("Pack does not belong to this closing");
  var items=a.db.queryForList("SELECT si.quantity,s.sale_datetime FROM sales_items si JOIN sales s USING(sale_id) JOIN products p ON p.product_id=si.product_id AND p.dgt_id=s.store_id WHERE si.sales_item_id=? AND s.store_id=? AND s.transaction_type='SALE' AND s.sale_status='COMPLETED' FOR SHARE OF si,s",in.salesItemId(),store);
  if(items.isEmpty())throw bad("Choose a completed sale from this store");
  var soldAt=((java.sql.Timestamp)items.getFirst().get("sale_datetime")).toInstant();
  var period=h.getFirst().get("sales_period_started_at");
  if(period==null||soldAt.isBefore(((java.sql.Timestamp)period).toInstant())||soldAt.isAfter(java.time.Instant.now()))throw bad("Receipt is outside this closing's sales period");
  BigDecimal quantity=(BigDecimal)items.getFirst().get("quantity");
  if(quantity.signum()<=0||quantity.stripTrailingZeros().scale()>0||quantity.compareTo(BigDecimal.valueOf(Integer.MAX_VALUE))>0)throw bad("Lottery quantity must be a positive whole ticket count");
  // A receipt line belongs to one closing only. Retain attribution on subsequent reads.
  var existing=a.db.queryForList("SELECT * FROM lottery_sales_links WHERE sales_item_id=?",in.salesItemId());
  if(!existing.isEmpty()&&Boolean.TRUE.equals(existing.getFirst().get("active"))&&((Number)existing.getFirst().get("lottery_pack_inventory_id")).longValue()!=id)throw conflict("Receipt line is already linked to another closing");
  a.db.update("INSERT INTO lottery_sales_links(sales_item_id,lottery_pack_inventory_id,pack_id,linked_by) VALUES (?,?,?,?) ON CONFLICT(sales_item_id) DO UPDATE SET active=true,lottery_pack_inventory_id=excluded.lottery_pack_inventory_id,pack_id=excluded.pack_id,linked_by=excluded.linked_by,linked_at=CURRENT_TIMESTAMP",in.salesItemId(),id,in.packId(),a.user());
  a.db.update("UPDATE lottery_pack_inventory SET sales_reviewed=false,updated_at=CURRENT_TIMESTAMP WHERE lottery_pack_inventory_id=?",id);
  a.audit(store,"LOTTERY_SALE_LINKED",Long.toString(id),json.writeValueAsString(Map.of("salesItemId",in.salesItemId(),"packId",in.packId())));
  return data(store,id);
 }
 @PostMapping("/{id}/sales/{item}/unlink") @Transactional public Object unlink(@PathVariable String store,@PathVariable long id,@PathVariable long item){
  access(store,"LOTTERY_CLOSE_SHIFT");lock(store);
  if(a.db.queryForObject("SELECT count(*) FROM lottery_pack_inventory WHERE lottery_pack_inventory_id=? AND dgt_id=? AND shift_closed_at IS NULL",Integer.class,id,store)!=1)throw conflict("Closing not found or already closed");
  a.db.update("UPDATE lottery_sales_links SET active=false WHERE sales_item_id=? AND lottery_pack_inventory_id=?",item,id);
  a.db.update("UPDATE lottery_pack_inventory SET sales_reviewed=false,updated_at=CURRENT_TIMESTAMP WHERE lottery_pack_inventory_id=?",id);
  a.audit(store,"LOTTERY_SALE_UNLINKED",Long.toString(id),json.writeValueAsString(Map.of("salesItemId",item)));
  return data(store,id);
 }
 public record Line(Long id,Integer lastSold,Integer recordedTickets){}
 public record Save(String version,Boolean close,BigDecimal cashCounted,String varianceNote,List<Line> packs,Boolean salesReviewed){}
 @PutMapping("/{id}") @Transactional public Object save(@PathVariable String store,@PathVariable long id,@RequestBody Save in){access(store,"LOTTERY_CLOSE_SHIFT");lock(store);
  var headers=a.db.queryForList("SELECT *,xmin::text AS version FROM lottery_pack_inventory WHERE lottery_pack_inventory_id=? AND dgt_id=? AND business_date IS NOT NULL FOR UPDATE",id,store);
  if(headers.size()!=1)throw conflict("Closing not found");var h=headers.getFirst();if(h.get("shift_closed_at")!=null||!Objects.equals(h.get("version"),in.version()))throw conflict("Closing changed or is already locked; refresh");
  boolean close=Boolean.TRUE.equals(in.close()),separate=Boolean.TRUE.equals(h.get("counter_separate"));var lines=a.db.queryForList("SELECT * FROM lottery_pack_inventory_items WHERE lottery_pack_inventory_id=? ORDER BY pack_id FOR UPDATE",id);
  if(in.packs()==null||in.packs().size()!=lines.size())throw bad("Submit every pack in this closing");Map<Long,Integer> values=new HashMap<>();for(Line line:in.packs()){if(line==null||line.id()==null||values.containsKey(line.id()))throw bad("Invalid or duplicate pack");values.put(line.id(),line.lastSold());}
  if(close){
   var linked=a.db.queryForList("SELECT si.quantity,s.sale_status,s.transaction_type,s.sale_datetime FROM lottery_sales_links l JOIN sales_items si USING(sales_item_id) JOIN sales s USING(sale_id) WHERE l.active AND l.lottery_pack_inventory_id=? FOR SHARE OF si,s",id);
   for(var sale:linked){BigDecimal q=(BigDecimal)sale.get("quantity");
    if(!"COMPLETED".equals(sale.get("sale_status"))||!"SALE".equals(sale.get("transaction_type"))||q.signum()<=0||q.stripTrailingZeros().scale()>0)throw conflict("A linked sale changed. Unlink it or correct the sale, then review again");
    var date=((java.sql.Timestamp)sale.get("sale_datetime")).toInstant();
    if(h.get("sales_period_started_at")==null||date.isBefore(((java.sql.Timestamp)h.get("sales_period_started_at")).toInstant())||date.isAfter(java.time.Instant.now()))throw conflict("A linked sale is outside this closing period");
   }
  }
  boolean ticketVariance=false;BigDecimal gross=BigDecimal.ZERO;for(var line:lines){Long pid=((Number)line.get("pack_id")).longValue();if(!values.containsKey(pid))throw bad("Pack does not belong to this closing");Integer last=values.get(pid);int opening=((Number)line.get("open_ticket_number")).intValue(),end=((Number)line.get("end_ticket_snapshot")).intValue();
   if((close&&last==null)||(last!=null&&(last<opening-1||last>end)))throw bad("Enter last sold between opening minus one (no sales) and the pack end");
   int recorded=a.db.queryForObject("SELECT coalesce(sum(si.quantity),0)::integer FROM lottery_sales_links l JOIN sales_items si USING(sales_item_id) JOIN sales sale USING(sale_id) WHERE l.active AND l.lottery_pack_inventory_id=? AND l.pack_id=? AND sale.store_id=? AND sale.transaction_type='SALE' AND sale.sale_status='COMPLETED'",Integer.class,id,pid,store);
   if(close&&!Objects.equals(in.packs().stream().filter(v->v.id().equals(pid)).findFirst().orElseThrow().recordedTickets(),recorded))throw conflict("Recorded sales changed; refresh and review the comparison");
   int sold=last==null?0:last-opening+1;ticketVariance|=sold!=recorded;
   if(close)a.db.update("UPDATE lottery_pack_inventory_items SET recorded_sales_snapshot=? WHERE lottery_pack_inventory_item_id=?",recorded,line.get("lottery_pack_inventory_item_id"));BigDecimal sales=((BigDecimal)line.get("ticket_price_snapshot")).multiply(BigDecimal.valueOf(sold)).setScale(2,RoundingMode.HALF_UP);BigDecimal commission=sales.multiply((BigDecimal)line.get("commission_percent_snapshot")).divide(BigDecimal.valueOf(100),2,RoundingMode.HALF_UP);gross=gross.add(sales);
   a.db.update("UPDATE lottery_pack_inventory_items SET last_sold_ticket_number=?,physical_quantity=?,expected_cash=?,commission_amount=?,updated_at=CURRENT_TIMESTAMP WHERE lottery_pack_inventory_item_id=?",last,end-opening+1-sold,sales,commission,line.get("lottery_pack_inventory_item_id"));}
  BigDecimal cash=separate?in.cashCounted():null;String note=in.varianceNote()!=null?in.varianceNote().trim():null;
  if(cash!=null&&(cash.signum()<0||cash.stripTrailingZeros().scale()>2||cash.compareTo(new BigDecimal("9999999999.99"))>0))throw bad("Enter a nonnegative cash count with up to two decimals");
  if(note!=null&&note.length()>2000)throw bad("Variance note must be at most 2,000 characters");
  if(close&&!Boolean.TRUE.equals(in.salesReviewed()))throw bad("Review and confirm the recorded sales for every pack before closing");
  if(close&&ticketVariance&&(note==null||note.isEmpty()))throw bad("Explain the difference between ticket positions and recorded sales");
  if(close&&separate&&(cash==null||(cash.compareTo(gross)!=0&&(note==null||note.isEmpty()))))throw bad("Counted cash is required; explain any variance");
  a.db.update("UPDATE lottery_pack_inventory SET sales_reviewed=?,cash_counted=?,variance_note=?,shift_closed_by=?,shift_closed_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END,updated_at=CURRENT_TIMESTAMP WHERE lottery_pack_inventory_id=? AND dgt_id=?",Boolean.TRUE.equals(in.salesReviewed()),cash,note,close?a.user():null,close,id,store);
  a.audit(store,close?"LOTTERY_CLOSING_CLOSED":"LOTTERY_CLOSING_DRAFT",Long.toString(id),json.writeValueAsString(Map.of("grossSales",gross,"separateCounter",separate,"close",close)));return data(store,id);
 }
}
