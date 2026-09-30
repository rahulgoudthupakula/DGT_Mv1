package com.dgt.backend.lottery.controller;
import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/access/stores/{store}/lottery-pack-history")
public class LotteryHistoryController {
 private final ScopedAccess a;private final LotteryDeliveryController permissions;
 public LotteryHistoryController(ScopedAccess a,LotteryDeliveryController permissions){this.a=a;this.permissions=permissions;}
 @GetMapping @Transactional(readOnly=true) public Object get(@PathVariable String store){
  if(!permissions.allowed(store,"LOTTERY_VIEW_REPORTS"))throw a.denied();
  ZoneId zone=ZoneId.of(a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store));
  var packs=a.db.queryForList("""
   SELECT p.lottery_pack_id::text AS id,g.game_name AS "gameName",p.pack_number AS "packNumber",p.start_ticket_number::text AS "startTicket",p.end_ticket_number::text AS "endTicket",
   CASE WHEN p.pack_settlement_reference IS NOT NULL THEN 'Settled' WHEN p.return_date IS NOT NULL THEN 'Returned' WHEN p.return_status='PENDING' THEN 'Return Pending'
    WHEN s.status_name='REJECTED' THEN 'Rejected' WHEN p.verification_status='NOT_VERIFIED' THEN 'Not Verified'
    WHEN coalesce(c.sold,0)>=p.total_tickets THEN 'Closed' WHEN coalesce(c.sold,0)>0 THEN 'Selling' WHEN p.activation_reference IS NOT NULL THEN 'Activated'
    WHEN p.verification_status='VERIFIED' THEN 'Verified' WHEN s.status_name='APPROVED' THEN 'Confirmed' ELSE 'Received' END AS "currentStatus",
   coalesce(c.sold,0)::integer AS "ticketsSold",p.total_tickets-coalesce(c.sold,0)::integer AS "ticketsRemaining",
   coalesce(p.settled_gross,c.gross,0) AS "grossSales",coalesce(p.settled_commission,c.commission,0) AS commission,
   coalesce(p.settled_gross,c.gross,0)-coalesce(p.settled_commission,c.commission,0) AS "netAmount",
   p.created_at AS received_at,concat_ws(' ',u.first_name,u.last_name) AS received_by,inv.invoice_number AS receipt
   FROM lottery_packs p JOIN lottery_games g ON g.lottery_game_id=p.lottery_game_id AND g.dgt_id=p.dgt_id
   JOIN status_types s ON s.status_type_id=p.status_id LEFT JOIN users u ON u.user_id=p.performed_by
   LEFT JOIN invoices inv ON inv.invoice_id=p.invoice_id AND inv.dgt_id=p.dgt_id
   LEFT JOIN LATERAL(SELECT sum(i.last_sold_ticket_number-i.open_ticket_number+1) AS sold,sum(i.expected_cash) AS gross,sum(i.commission_amount) AS commission
    FROM lottery_pack_inventory_items i JOIN lottery_pack_inventory h USING(lottery_pack_inventory_id)
    WHERE i.pack_id=p.lottery_pack_id AND h.dgt_id=p.dgt_id AND h.shift_closed_at IS NOT NULL)c ON true
   WHERE p.dgt_id=? ORDER BY p.created_at DESC,p.lottery_pack_id DESC
   """,store);
  var events=a.db.queryForList("""
   SELECT p.lottery_pack_id::text AS pack,e.event_type,e.created_at,concat_ws(' ',u.first_name,u.last_name) AS actor,
    CASE WHEN e.event_type='LOTTERY_ACTIVATION_RECORDED' THEN coalesce(e.changes->>'reference',p.activation_reference)
     WHEN e.event_type='LOTTERY_PACK_SETTLE' THEN p.pack_settlement_reference WHEN e.event_type LIKE 'LOTTERY_PACK_%' THEN p.distributor_return_reference
     ELSE e.target_id END AS reference
   FROM access_audit_events e JOIN lottery_packs p ON p.dgt_id=e.dgt_id AND p.lottery_pack_id::text=e.target_id
   LEFT JOIN users u ON u.user_id=e.actor_user_id WHERE e.dgt_id=? AND
    (e.event_type LIKE 'LOTTERY_DELIVERY_%' OR e.event_type LIKE 'LOTTERY_VERIFICATION_%' OR e.event_type='LOTTERY_ACTIVATION_RECORDED' OR e.event_type LIKE 'LOTTERY_PACK_%')
   UNION ALL
   SELECT i.pack_id::text,e.event_type,e.created_at,concat_ws(' ',u.first_name,u.last_name),e.target_id
   FROM access_audit_events e JOIN lottery_pack_inventory h ON h.lottery_pack_inventory_id::text=e.target_id AND h.dgt_id=e.dgt_id
   JOIN lottery_pack_inventory_items i USING(lottery_pack_inventory_id) LEFT JOIN users u ON u.user_id=e.actor_user_id
   WHERE e.dgt_id=? AND e.event_type IN ('LOTTERY_CLOSING_OPENED','LOTTERY_CLOSING_DRAFT','LOTTERY_CLOSING_CLOSED')
   ORDER BY created_at
   """,store,store);
  var grouped=new HashMap<String,List<Map<String,Object>>>();for(var e:events){String action=e.get("event_type").toString();String type=action.contains("CLOSING")?"shift":action.contains("ACTIVATION")?"activation":action.endsWith("SETTLE")?"settlement":action.contains("RETURN")?"return":"delivery";
   grouped.computeIfAbsent(e.get("pack").toString(),k->new ArrayList<>()).add(event(action.replace("LOTTERY_","").replace('_',' '),e.get("created_at"),e.get("actor"),e.get("reference"),type,zone));}
  var result=new ArrayList<Map<String,Object>>();for(var p:packs){var timeline=new ArrayList<Map<String,Object>>();timeline.add(event("Received",p.get("received_at"),p.get("received_by"),p.get("receipt"),"delivery",zone));timeline.addAll(grouped.getOrDefault(p.get("id").toString(),List.of()));
   var row=Rows.normalize(p);row.remove("received_at");row.remove("received_by");row.remove("receipt");row.put("timeline",timeline);row.put("lastActionDate",timeline.getLast().get("date"));result.add(row);}
  return Map.of("packs",result);
 }
 private Map<String,Object> event(String status,Object timestamp,Object actor,Object reference,String type,ZoneId zone){var time=((java.sql.Timestamp)timestamp).toInstant().atZone(zone);return Map.of("status",status,"date",time.toLocalDate().toString(),"time",time.format(DateTimeFormatter.ofPattern("HH:mm:ss")),"user",Objects.toString(actor,"Unknown"),"referenceId",Objects.toString(reference,"N/A"),"referenceType",type);}
}
