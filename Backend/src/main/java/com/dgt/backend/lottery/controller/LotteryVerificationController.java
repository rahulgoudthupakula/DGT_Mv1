package com.dgt.backend.lottery.controller;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/access/stores/{store}/lottery-verification")
public class LotteryVerificationController {
 private final ScopedAccess a;private final LotteryDeliveryController permissions;private final ObjectMapper json;
 public LotteryVerificationController(ScopedAccess a,LotteryDeliveryController permissions,ObjectMapper json){this.a=a;this.permissions=permissions;this.json=json;}
 private void access(String store,String code){if(!permissions.allowed(store,code))throw a.denied();}
 private ResponseStatusException bad(String text){return new ResponseStatusException(HttpStatus.BAD_REQUEST,text);}
 private ResponseStatusException conflict(){return new ResponseStatusException(HttpStatus.CONFLICT,"Pack changed or is not eligible. Refresh the page before trying again.");}
 @GetMapping @Transactional(readOnly=true)
 public Object get(@PathVariable String store){boolean verify=permissions.allowed(store,"LOTTERY_CONFIRM_PACKS"),activate=permissions.allowed(store,"LOTTERY_ACTIVATE_PACKS");if(!verify&&!activate)throw a.denied();
 var packs=a.db.queryForList("""
 SELECT p.lottery_pack_id::text AS id,p.xmin::text AS version,g.lottery_game_id::text AS "gameId",g.game_name AS "gameName",p.pack_number AS "packNumber",
 p.start_ticket_number::text AS "startTicket",p.end_ticket_number::text AS "endTicket",p.total_tickets AS "ticketsCount",p.received_pack_value AS "packValue",
 p.delivery_decided_at AS "confirmedDate",concat_ws(' ',d.first_name,d.last_name) AS "confirmedBy",upper(g.status)='ACTIVE' AS "gameActive",
 p.activation_reference IS NOT NULL AS "alreadyActivated",
 EXISTS(SELECT 1 FROM lottery_pack_inventory_items x WHERE x.pack_id=p.lottery_pack_id AND x.last_sold_ticket_number IS NOT NULL) AS "ticketsSoldBeforeActivation",
 CASE WHEN p.activation_reference IS NULL THEN 'pending' ELSE 'activated' END AS "activationStatus",
 p.activation_reference AS "activationConfirmation",p.activation_recorded_at AS "activatedAt",concat_ws(' ',u.first_name,u.last_name) AS "activatedBy",
 p.verification_status='VERIFIED' AS verified,p.verification_status='NOT_VERIFIED' AS "notVerified",
 concat_ws(' ',v.first_name,v.last_name) AS "verifiedBy",p.verification_decided_at AS "verifiedAt",
 concat_ws(' ',v.first_name,v.last_name) AS "notVerifiedBy",p.verification_decided_at AS "notVerifiedAt",p.verification_reason AS "notVerifiedReason"
 FROM lottery_packs p JOIN lottery_games g ON g.lottery_game_id=p.lottery_game_id AND g.dgt_id=p.dgt_id
 JOIN status_types s ON s.status_type_id=p.status_id
 LEFT JOIN users d ON d.user_id=p.delivery_decided_by LEFT JOIN users v ON v.user_id=p.verification_decided_by LEFT JOIN users u ON u.user_id=p.activation_recorded_by
 WHERE p.dgt_id=? AND s.status_name='APPROVED' AND p.delivery_decided_at IS NOT NULL AND p.return_status IS NULL AND p.return_date IS NULL AND p.pack_settlement_reference IS NULL ORDER BY p.lottery_pack_id DESC
 """,store).stream().map(Rows::normalize).toList();return Map.of("packs",packs,"canVerify",verify,"canActivate",activate);
 }
 public record Selected(String id,String version,String reference){}
 public record Decision(String action,String reason,List<Selected> packs){}
 public record Activation(List<Selected> packs){}
 private List<Map<String,Object>> lockPacks(String store,List<Selected> selected){
  if(selected==null||selected.isEmpty()||selected.size()>1000)throw bad("Select 1–1,000 packs");
  a.db.queryForObject("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",String.class,store);
  Set<Long> ids=new HashSet<>();List<Map<String,Object>> rows=new ArrayList<>();
  for(Selected p:selected){long id;try{id=Long.parseLong(p.id());}catch(Exception e){throw bad("Invalid pack identifier");}if(!ids.add(id))throw bad("Pack selected more than once");
   var found=a.db.queryForList("SELECT p.*,p.xmin::text AS version,g.status AS game_status,EXISTS(SELECT 1 FROM lottery_pack_inventory_items x WHERE x.pack_id=p.lottery_pack_id AND x.last_sold_ticket_number IS NOT NULL) AS sold FROM lottery_packs p JOIN lottery_games g ON g.lottery_game_id=p.lottery_game_id AND g.dgt_id=p.dgt_id JOIN status_types s ON s.status_type_id=p.status_id WHERE p.lottery_pack_id=? AND p.dgt_id=? AND s.status_name='APPROVED' AND p.delivery_decided_at IS NOT NULL AND p.return_status IS NULL AND p.return_date IS NULL AND p.pack_settlement_reference IS NULL FOR UPDATE OF p FOR SHARE OF g",id,store);
   if(found.size()!=1||!Objects.equals(found.getFirst().get("version"),p.version()))throw conflict();
   if(found.getFirst().get("activation_reference")!=null)throw conflict();rows.add(found.getFirst());
  }return rows;
 }
 @PostMapping("/decision") @Transactional
 public Object decision(@PathVariable String store,@RequestBody Decision in){access(store,"LOTTERY_CONFIRM_PACKS");
  if(!Set.of("VERIFY","NOT_VERIFIED","RESTORE").contains(Objects.toString(in.action(),"")))throw bad("Invalid verification action");
  String reason=in.reason()==null?"":in.reason().trim();if(reason.length()>2000||(in.action().equals("NOT_VERIFIED")&&reason.isEmpty()))throw bad("A reason of 1–2,000 characters is required");
  var rows=lockPacks(store,in.packs());for(var row:rows){String expected=in.action().equals("RESTORE")?"NOT_VERIFIED":"PENDING";if(!expected.equals(row.get("verification_status")))throw conflict();
   if(in.action().equals("VERIFY")&&(!"ACTIVE".equalsIgnoreCase(Objects.toString(row.get("game_status"),""))||Boolean.TRUE.equals(row.get("sold"))))throw bad("An inactive game or pack with recorded ticket sales cannot be verified");
   boolean restore=in.action().equals("RESTORE");String state=restore?"PENDING":in.action().equals("VERIFY")?"VERIFIED":"NOT_VERIFIED";
   a.db.update("UPDATE lottery_packs SET verification_status=?,verification_decided_by=?,verification_decided_at=CASE WHEN ? THEN NULL ELSE CURRENT_TIMESTAMP END,verification_reason=?,updated_at=CURRENT_TIMESTAMP WHERE lottery_pack_id=? AND dgt_id=?",state,restore?null:a.user(),restore,in.action().equals("NOT_VERIFIED")?reason:null,row.get("lottery_pack_id"),store);
   a.audit(store,"LOTTERY_VERIFICATION_"+in.action(),row.get("lottery_pack_id").toString(),json.writeValueAsString(Map.of("action",in.action(),"reason",reason,"previousStatus",expected)));
  }return Map.of("updated",rows.size());
 }
 @PostMapping("/activation") @Transactional
 public Object activation(@PathVariable String store,@RequestBody Activation in){access(store,"LOTTERY_ACTIVATE_PACKS");var rows=lockPacks(store,in.packs());
  for(int i=0;i<rows.size();i++){var row=rows.get(i);String reference=in.packs().get(i).reference();if(reference==null||reference.trim().isEmpty()||reference.trim().length()>150)throw bad("Enter the actual terminal/provider activation reference for each pack (maximum 150 characters)");
   if(!"VERIFIED".equals(row.get("verification_status")))throw conflict();
   if(!"ACTIVE".equalsIgnoreCase(Objects.toString(row.get("game_status"),""))||Boolean.TRUE.equals(row.get("sold")))throw bad("An inactive game or pack with recorded ticket sales cannot be activated here");
   a.db.update("UPDATE lottery_packs SET activation_reference=?,activation_recorded_by=?,activation_recorded_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE lottery_pack_id=? AND dgt_id=?",reference.trim(),a.user(),row.get("lottery_pack_id"),store);
   a.audit(store,"LOTTERY_ACTIVATION_RECORDED",row.get("lottery_pack_id").toString(),json.writeValueAsString(Map.of("reference",reference.trim(),"source","EXTERNAL_TERMINAL")));
  }return Map.of("updated",rows.size());
 }
}
