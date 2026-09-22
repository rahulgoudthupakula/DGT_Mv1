package com.dgt.backend.lottery.controller;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import java.math.*;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/v1/access/stores/{store}/lottery-deliveries")
public class LotteryDeliveryController {
 private final ScopedAccess a; private final ObjectMapper json;
 public LotteryDeliveryController(ScopedAccess a,ObjectMapper json){this.a=a;this.json=json;}
 boolean allowed(String store,String code){long uid=a.user();if(a.admin(uid,a.company(store)))return true;
  return Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM user_roles r JOIN role_types t USING(role_type_id) JOIN store_role_permissions p ON p.dgt_id=r.dgt_id AND p.role_type_id=r.role_type_id WHERE r.user_id=? AND r.dgt_id=? AND r.is_active AND t.is_active AND upper(t.role_type_name) IN ('MANAGER','CASHIER','ACCOUNTANT') AND p.permission_code=? AND p.allowed)",Boolean.class,uid,store,code));}
 private void access(String store,String code){if(!allowed(store,code))throw a.denied();}
 private ResponseStatusException bad(String text){return new ResponseStatusException(HttpStatus.BAD_REQUEST,text);}
 private ResponseStatusException conflict(String text){return new ResponseStatusException(HttpStatus.CONFLICT,text);}
 private void lock(String store){a.db.queryForObject("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",String.class,store);}
 private long status(String name){var ids=a.db.queryForList("SELECT status_type_id FROM status_types WHERE status_name=?",Long.class,name);if(ids.size()!=1)throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Lottery delivery statuses are not configured");return ids.getFirst();}
 private long id(String value){try{long id=Long.parseLong(value);if(id>0)return id;}catch(Exception ignored){}throw bad("Invalid record identifier");}
 public record Item(String gameId,String packNumber,Integer quantity){}
 public record Receipt(String distributorId,LocalDate deliveryDate,String referenceNumber,List<Item> items){}
 public record PackVersion(String id,String version){}
 public record Decision(String action,String reason,List<PackVersion> packs){}
 private List<Map<String,Object>> packs(String store){return a.db.queryForList("""
 SELECT p.lottery_pack_id::text AS id,p.xmin::text AS version,p.lottery_game_id::text AS "gameId",g.game_name AS "gameName",p.pack_number AS "packNumber",
 p.start_ticket_number::text AS "startTicket",p.end_ticket_number::text AS "endTicket",p.total_tickets AS "ticketsCount",p.received_pack_value AS "packValue",
 i.invoice_number AS "deliveryRef",i.received_date::text AS "receivedDate",concat_ws(' ',u.first_name,u.last_name) AS "receivedBy",
 CASE s.status_name WHEN 'APPROVED' THEN 'CONFIRMED' ELSE s.status_name END AS status,
 p.delivery_decided_at AS "decidedAt",p.delivery_rejection_reason AS reason
 FROM lottery_packs p JOIN lottery_games g ON g.lottery_game_id=p.lottery_game_id AND g.dgt_id=p.dgt_id
 JOIN invoices i ON i.invoice_id=p.invoice_id AND i.dgt_id=p.dgt_id
 JOIN users u ON u.user_id=p.performed_by JOIN status_types s ON s.status_type_id=p.status_id
 WHERE p.dgt_id=? ORDER BY p.lottery_pack_id DESC
 """,store).stream().map(Rows::normalize).toList();}
 @GetMapping @Transactional(readOnly=true)
 public Object get(@PathVariable String store){boolean receive=allowed(store,"LOTTERY_RECEIVE_DELIVERY"),confirm=allowed(store,"LOTTERY_CONFIRM_PACKS");if(!receive&&!confirm)throw a.denied();
  return Map.of("packs",packs(store),"canReceive",receive,"canConfirm",confirm,
   "receiver",a.db.queryForObject("SELECT concat_ws(' ',first_name,last_name) FROM users WHERE user_id=?",String.class,a.user()),
   "vendors",a.db.queryForList("SELECT vendor_id::text AS id,vendor_name AS name FROM vendors WHERE dgt_id=? AND is_active ORDER BY vendor_name",store),
   "games",a.db.queryForList("SELECT lottery_game_id::text AS id,game_name AS name,tickets_per_pack AS \"ticketsPerPack\",ticket_price AS \"ticketPrice\" FROM lottery_games WHERE dgt_id=? AND upper(status)='ACTIVE' ORDER BY game_name",store),
   "today",a.db.queryForObject("SELECT (CURRENT_TIMESTAMP AT TIME ZONE timezone)::date::text FROM stores WHERE dgt_id=?",String.class,store));}
 @PostMapping @Transactional
 public Object receive(@PathVariable String store,@RequestBody Receipt in,@RequestHeader("Idempotency-Key") String key){access(store,"LOTTERY_RECEIVE_DELIVERY");lock(store);
  if(key.isBlank()||key.length()>100)throw bad("Invalid receipt request key");
  var previous=a.db.queryForList("SELECT changes FROM access_audit_events WHERE dgt_id=? AND actor_user_id=? AND event_type='LOTTERY_RECEIVED' AND changes->>'requestKey'=?",store,a.user(),key);
  if(!previous.isEmpty()){var saved=json.readTree(previous.getFirst().get("changes").toString());if(!saved.get("input").equals(json.valueToTree(in)))throw conflict("Request key was already used for a different receipt");return Map.of("receiptId",saved.get("receiptId").asText());}
  if(in.deliveryDate()==null||in.items()==null||in.items().isEmpty()||in.items().size()>100)throw bad("Enter a delivery date and 1–100 receipt lines");
  LocalDate today=a.db.queryForObject("SELECT (CURRENT_TIMESTAMP AT TIME ZONE timezone)::date FROM stores WHERE dgt_id=?",LocalDate.class,store);
  if(in.deliveryDate().isAfter(today))throw bad("Delivery date cannot be in the future");
  long vendor=id(in.distributorId());if(a.db.queryForList("SELECT vendor_id FROM vendors WHERE vendor_id=? AND dgt_id=? AND is_active FOR SHARE",vendor,store).isEmpty())throw bad("Select an active vendor for this store");
  String ref=in.referenceNumber()==null?"":in.referenceNumber().trim();if(ref.length()>100)throw bad("Receipt reference must be at most 100 characters");
  if(!ref.isEmpty()&&!a.db.queryForList("SELECT invoice_id FROM invoices WHERE dgt_id=? AND vendor_id=? AND invoice_type='LOTTERY' AND invoice_number=?",store,vendor,ref).isEmpty())throw conflict("This vendor receipt reference has already been received");
  if(ref.isEmpty())ref="LOT-"+UUID.randomUUID();
  long invoice=a.db.queryForObject("INSERT INTO invoices(dgt_id,vendor_id,invoice_number,invoice_type,invoice_date,received_date,received_by) VALUES (?,?,?,'LOTTERY',?,?,?) RETURNING invoice_id",Long.class,store,vendor,ref,in.deliveryDate(),in.deliveryDate(),a.user());
  int total=0;Set<String> identities=new HashSet<>();
  for(Item item:in.items()){
   if(item==null||item.quantity()==null||item.quantity()<1||(total+=item.quantity())>1000||item.packNumber()==null||!item.packNumber().matches("[0-9]{1,50}"))throw bad("Each line needs a numeric book number and positive whole quantity; maximum 1,000 packs per receipt");
   long game=id(item.gameId());var games=a.db.queryForList("SELECT * FROM lottery_games WHERE lottery_game_id=? AND dgt_id=? AND upper(status)='ACTIVE' FOR SHARE",game,store);if(games.size()!=1)throw bad("Select an active game for this store");
   var g=games.getFirst();
   if((g.get("start_date")!=null&&in.deliveryDate().isBefore(((java.sql.Date)g.get("start_date")).toLocalDate()))||(g.get("end_date")!=null&&in.deliveryDate().isAfter(((java.sql.Date)g.get("end_date")).toLocalDate())))throw bad("Delivery date is outside this game's start/end dates");
   int tickets=((Number)g.get("tickets_per_pack")).intValue();BigDecimal price=(BigDecimal)g.get("ticket_price");BigDecimal value=price.multiply(BigDecimal.valueOf(tickets));
   if(tickets<1||price.signum()<0||value.compareTo(new BigDecimal("9999999999.99"))>0)throw bad("Game ticket count or price is invalid");
   for(int i=0;i<item.quantity();i++){
    String number=new BigInteger(item.packNumber()).add(BigInteger.valueOf(i)).toString();if(number.length()>50)throw bad("Book number exceeds 50 digits");
    String pack="0".repeat(Math.max(0,item.packNumber().length()-number.length()))+number;
    if(!identities.add(game+":"+number)||!a.db.queryForList("SELECT lottery_pack_id FROM lottery_packs WHERE dgt_id=? AND lottery_game_id=? AND ltrim(pack_number,'0')=ltrim(?,'0')",store,game,pack).isEmpty())throw conflict("Duplicate book number "+pack+" for this game");
    a.db.update("INSERT INTO lottery_packs(invoice_id,dgt_id,vendor_id,lottery_game_id,pack_number,start_ticket_number,end_ticket_number,total_tickets,status_id,performed_by,received_ticket_price,received_pack_value) VALUES (?,?,?,?,?,0,?,?,?,?,?,?)",invoice,store,vendor,game,pack,tickets-1,tickets,status("PENDING"),a.user(),price,value);
   }
  }
  a.audit(store,"LOTTERY_RECEIVED",Long.toString(invoice),json.writeValueAsString(Map.of("requestKey",key,"input",in,"receiptId",Long.toString(invoice),"packs",total)));
  return Map.of("receiptId",Long.toString(invoice));
 }
 @PostMapping("/decision") @Transactional
 public Object decide(@PathVariable String store,@RequestBody Decision in){access(store,"LOTTERY_CONFIRM_PACKS");lock(store);
  if(!Set.of("CONFIRM","REJECT").contains(Objects.toString(in.action(),""))||in.packs()==null||in.packs().isEmpty()||in.packs().size()>1000)throw bad("Select 1–1,000 packs and a valid action");
  String reason=in.reason()==null?"":in.reason().trim();if(reason.length()>2000||("REJECT".equals(in.action())&&reason.isEmpty()))throw bad("Enter a rejection reason of 1–2,000 characters");
  Set<Long> ids=new HashSet<>();for(PackVersion p:in.packs()){
   if(p==null)throw bad("Invalid selected pack");long pid=id(p.id());if(!ids.add(pid))throw bad("Pack selected more than once");
   int changed=a.db.update("UPDATE lottery_packs SET status_id=?,delivery_decided_by=?,delivery_decided_at=CURRENT_TIMESTAMP,delivery_rejection_reason=?,updated_at=CURRENT_TIMESTAMP WHERE lottery_pack_id=? AND dgt_id=? AND status_id=? AND xmin::text=? AND lottery_game_id IS NOT NULL",status(in.action().equals("CONFIRM")?"APPROVED":"REJECTED"),a.user(),in.action().equals("REJECT")?reason:null,pid,store,status("PENDING"),p.version());
   if(changed!=1)throw conflict("A selected pack is no longer pending or changed. Refresh before trying again.");
   a.audit(store,"LOTTERY_DELIVERY_"+in.action(),Long.toString(pid),json.writeValueAsString(Map.of("action",in.action(),"reason",reason)));
  }
  return Map.of("updated",ids.size());
 }
}
