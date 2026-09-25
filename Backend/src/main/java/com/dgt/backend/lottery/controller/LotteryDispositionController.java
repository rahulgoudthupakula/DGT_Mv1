package com.dgt.backend.lottery.controller;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/v1/access/stores/{store}/lottery-dispositions")
public class LotteryDispositionController {
 private final ScopedAccess a; private final LotteryDeliveryController permissions; private final ObjectMapper json;
 public LotteryDispositionController(ScopedAccess a,LotteryDeliveryController permissions,ObjectMapper json){this.a=a;this.permissions=permissions;this.json=json;}
 private void access(String store,String code){if(!permissions.allowed(store,code))throw a.denied();}
 private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.CONFLICT,message);}
 private void lock(String store){a.db.queryForObject("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",String.class,store);}
 private static final String QUERY="""
 SELECT p.*,p.lottery_pack_id::text AS id,p.xmin::text AS version,g.game_name AS "gameName",p.pack_number AS "packNumber",
 coalesce(c.sold,0)::integer AS "ticketsSold",p.total_tickets-coalesce(c.sold,0)::integer AS "ticketsUnsold",
 coalesce(p.settled_gross,c.gross,0) AS "grossSales",coalesce(p.settled_commission,c.commission,0) AS commission,
 coalesce(p.settled_gross,c.gross,0)-coalesce(p.settled_commission,c.commission,0) AS "netAmountDue",
 NOT EXISTS(SELECT 1 FROM lottery_pack_inventory_items i JOIN lottery_pack_inventory h USING(lottery_pack_inventory_id)
 WHERE i.pack_id=p.lottery_pack_id AND h.shift_closed_at IS NULL) AS "shiftClosed",
 (coalesce(c.sold,0)<>coalesce(c.last_sold-p.start_ticket_number+1,0) OR coalesce(c.unreviewed,false)) AS "hasGaps",
 p.pack_settlement_reference AS "settlementRef",p.pack_settled_at AS "settledAt",concat_ws(' ',u.first_name,u.last_name) AS "settledBy",
 p.start_ticket_number::text AS "startTicket",coalesce(c.last_sold,p.start_ticket_number-1)::text AS "lastSoldTicket",
 p.total_tickets-coalesce(c.sold,0)::integer AS "ticketsRemaining",
 (p.total_tickets-coalesce(c.sold,0))*p.received_ticket_price AS "packValue",
 p.return_type AS "returnType",p.return_reason AS "returnReason",p.return_date AS "returnDate",
 p.distributor_return_reference AS "distributorRef",concat_ws(' ',r.first_name,r.last_name) AS "approvedBy",
 p.pack_settlement_reference AS "linkedSettlementId"
 FROM lottery_packs p JOIN lottery_games g ON g.lottery_game_id=p.lottery_game_id AND g.dgt_id=p.dgt_id
 LEFT JOIN users u ON u.user_id=p.pack_settled_by LEFT JOIN users r ON r.user_id=p.return_confirmed_by
 LEFT JOIN LATERAL(SELECT sum(i.last_sold_ticket_number-i.open_ticket_number+1) AS sold,max(i.last_sold_ticket_number) AS last_sold,
 sum(i.expected_cash) AS gross,sum(i.commission_amount) AS commission,
 bool_or(NOT h.sales_reviewed OR i.recorded_sales_snapshot IS NULL OR i.last_sold_ticket_number IS NULL) AS unreviewed
 FROM lottery_pack_inventory_items i JOIN lottery_pack_inventory h USING(lottery_pack_inventory_id)
 WHERE i.pack_id=p.lottery_pack_id AND h.dgt_id=p.dgt_id AND h.shift_closed_at IS NOT NULL)c ON true
 WHERE p.dgt_id=? AND p.delivery_decided_at IS NOT NULL AND p.status_id=(SELECT status_type_id FROM status_types WHERE status_name='APPROVED')
 ORDER BY p.lottery_pack_id
 """;
 private boolean ready(Map<String,Object> p){return Boolean.TRUE.equals(p.get("shiftClosed"))&&!Boolean.TRUE.equals(p.get("hasGaps"))&&p.get("pack_settlement_reference")==null&&("RETURNED".equals(p.get("return_status"))||((Number)p.get("ticketsUnsold")).intValue()==0)&&!"PENDING".equals(p.get("return_status"));}
 private boolean returnable(Map<String,Object> p){return Boolean.TRUE.equals(p.get("shiftClosed"))&&!Boolean.TRUE.equals(p.get("hasGaps"))&&p.get("pack_settlement_reference")==null&&p.get("return_status")==null&&p.get("return_date")==null&&((Number)p.get("ticketsRemaining")).intValue()>0;}
 private Object data(String store){var settlements=new ArrayList<Map<String,Object>>();var returns=new ArrayList<Map<String,Object>>();for(var raw:a.db.queryForList(QUERY,store)){
  var p=Rows.normalize(raw);p.put("status",p.get("pack_settlement_reference")!=null?"settled":ready(raw)?"ready":"blocked");
  p.put("blockedReason",!Boolean.TRUE.equals(raw.get("shiftClosed"))?"Close the open shift first":Boolean.TRUE.equals(raw.get("hasGaps"))?"Closing history is incomplete or sales have not been reviewed":"Sell all tickets or confirm the return of remaining tickets first");settlements.add(p);
  if(((Number)raw.get("ticketsRemaining")).intValue()>0){var ret=new LinkedHashMap<>(p);ret.put("status",raw.get("pack_settlement_reference")!=null?"settled":"RETURNED".equals(raw.get("return_status"))?"returned":"PENDING".equals(raw.get("return_status"))?"pending":returnable(raw)?"eligible":"blocked");returns.add(ret);}
 }return Map.of("settlementPacks",settlements,"returnablePacks",returns,"canSettle",permissions.allowed(store,"LOTTERY_SETTLE_PACKS"),"canReturn",permissions.allowed(store,"LOTTERY_RETURN_PACKS"));}
 @GetMapping @Transactional(readOnly=true) public Object get(@PathVariable String store){if(!permissions.allowed(store,"LOTTERY_SETTLE_PACKS")&&!permissions.allowed(store,"LOTTERY_RETURN_PACKS"))throw a.denied();return data(store);}
 public record Selected(String id,String version){}
 public record Command(String action,List<Selected> packs,String returnType,String reason,String reference){}
 @PostMapping @Transactional public Object change(@PathVariable String store,@RequestBody Command in){
  if(!Set.of("SETTLE","REQUEST_RETURN","CONFIRM_RETURN").contains(Objects.toString(in.action(),"")))throw bad("Invalid action");
  new com.dgt.backend.access.PagePermissions(a).requireAny(store,in.action().equals("SETTLE")?"LOTTERY_PAGE_RETURNS_SETTLE":"LOTTERY_PAGE_RETURNS_RETURN");
  access(store,in.action().equals("SETTLE")?"LOTTERY_SETTLE_PACKS":"LOTTERY_RETURN_PACKS");lock(store);a.db.queryForList("SELECT lottery_pack_id FROM lottery_packs WHERE dgt_id=? FOR UPDATE",store);
  if(in.packs()==null||in.packs().isEmpty()||in.packs().size()>1000)throw bad("Select 1–1,000 packs");
  var all=new HashMap<String,Map<String,Object>>();for(var p:a.db.queryForList(QUERY,store))all.put(p.get("id").toString(),p);
  var seen=new HashSet<String>();for(var selected:in.packs()){
   if(selected==null||!seen.add(selected.id()))throw bad("Invalid or duplicate pack");var p=all.get(selected.id());
   if(p==null||!Objects.equals(p.get("version"),selected.version()))throw bad("Pack changed; refresh before trying again");long id=((Number)p.get("lottery_pack_id")).longValue();
   if(in.action().equals("SETTLE")){
    if(!ready(p))throw bad("Pack is not ready: close and reconcile its shifts, then sell or return remaining tickets");
    String ref="SET-"+UUID.randomUUID();
    a.db.update("UPDATE lottery_packs SET pack_settlement_reference=?,pack_settled_at=CURRENT_TIMESTAMP,pack_settled_by=?,settled_gross=?,settled_commission=?,updated_at=CURRENT_TIMESTAMP WHERE lottery_pack_id=?",ref,a.user(),p.get("grossSales"),p.get("commission"),id);
   }else if(in.action().equals("REQUEST_RETURN")){
    if(!returnable(p))throw bad("Pack is not eligible for return; close and reconcile its shift first");
    int sold=((Number)p.get("ticketsSold")).intValue();String type=sold==0?"full":"partial";
    if(!type.equals(in.returnType()))throw bad("Use "+type+" return for this pack");
    String reason=Objects.toString(in.reason(),"").trim(),reference=Objects.toString(in.reference(),"").trim();
    if(reason.isEmpty()||reason.length()>2000||reference.isEmpty()||reference.length()>150)throw bad("Enter a reason and distributor reference (up to 150 characters)");
    a.db.update("UPDATE lottery_packs SET return_status='PENDING',return_type=?,return_reason=?,distributor_return_reference=?,return_requested_by=?,return_requested_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE lottery_pack_id=?",type,reason,reference,a.user(),id);
   }else{
    if(!"PENDING".equals(p.get("return_status"))||!Boolean.TRUE.equals(p.get("shiftClosed"))||p.get("pack_settlement_reference")!=null)throw bad("Pack has no pending return or its shift is still open");
    a.db.update("UPDATE lottery_packs SET return_status='RETURNED',return_date=CURRENT_TIMESTAMP,return_confirmed_by=?,updated_at=CURRENT_TIMESTAMP WHERE lottery_pack_id=?",a.user(),id);
   }
   a.audit(store,"LOTTERY_PACK_"+in.action(),selected.id(),json.writeValueAsString(Map.of("action",in.action(),"pack",selected.id())));
  }return data(store);
 }
}
