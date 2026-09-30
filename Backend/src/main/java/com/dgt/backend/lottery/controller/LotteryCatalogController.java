package com.dgt.backend.lottery.controller;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import java.math.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/access/stores/{store}/lottery-games")
public class LotteryCatalogController {
 private final ScopedAccess a;private final LotteryDeliveryController permissions;private final ObjectMapper json;
 public LotteryCatalogController(ScopedAccess a,LotteryDeliveryController permissions,ObjectMapper json){this.a=a;this.permissions=permissions;this.json=json;}
 private void edit(String store){if(!permissions.allowed(store,"LOTTERY_SETTINGS"))throw a.denied();}
 private LocalDate today(String store){return a.db.queryForObject("SELECT (CURRENT_TIMESTAMP AT TIME ZONE timezone)::date FROM stores WHERE dgt_id=?",LocalDate.class,store);}
 private ResponseStatusException bad(String m){return new ResponseStatusException(HttpStatus.BAD_REQUEST,m);}
 @GetMapping public Object get(@PathVariable String store){boolean canEdit=permissions.allowed(store,"LOTTERY_SETTINGS");if(!canEdit&&!permissions.allowed(store,"LOTTERY_VIEW_REPORTS"))throw a.denied();return data(store,canEdit);}
 private Object data(String store,boolean canEdit){return Map.of("canEdit",canEdit,"today",today(store),"games",a.db.queryForList("""
 SELECT g.lottery_game_id::text AS id,g.xmin::text AS version,g.game_name AS "gameName",g.game_code AS "gameCode",g.ticket_price AS "ticketPrice",g.tickets_per_pack AS "ticketsPerPack",g.pack_value AS "packValue",
 CASE WHEN g.commission_effective_date<=? THEN g.scheduled_commission_percent ELSE g.commission_percent END AS "commissionPercent",
 CASE WHEN upper(g.status)='ACTIVE' THEN 'Active' ELSE 'Discontinued' END AS status,
 coalesce(g.start_date,(g.created_at AT TIME ZONE s.timezone)::date)::text AS "startDate",g.end_date::text AS "endDate",
 CASE WHEN g.commission_effective_date>? THEN g.scheduled_commission_percent END AS "scheduledCommission",
 CASE WHEN g.commission_effective_date>? THEN g.commission_effective_date::text END AS "commissionEffectiveDate",
 EXISTS(SELECT 1 FROM lottery_packs p WHERE p.lottery_game_id=g.lottery_game_id AND p.dgt_id=g.dgt_id) AS "hasExistingPacks",
 (SELECT count(*) FROM lottery_packs p WHERE p.lottery_game_id=g.lottery_game_id AND p.dgt_id=g.dgt_id AND p.activation_reference IS NOT NULL AND p.return_status IS NULL AND p.return_date IS NULL AND p.pack_settlement_reference IS NULL AND NOT EXISTS(SELECT 1 FROM lottery_pack_inventory_items i JOIN lottery_pack_inventory h USING(lottery_pack_inventory_id) WHERE i.pack_id=p.lottery_pack_id AND h.shift_closed_at IS NOT NULL AND i.last_sold_ticket_number>=p.end_ticket_number)) AS "activePacksCount",
 (SELECT max(p.created_at AT TIME ZONE s.timezone)::date::text FROM lottery_packs p WHERE p.lottery_game_id=g.lottery_game_id AND p.dgt_id=g.dgt_id) AS "lastDeliveryDate",
 (SELECT max(h.shift_closed_at AT TIME ZONE s.timezone)::date::text FROM lottery_pack_inventory_items i JOIN lottery_pack_inventory h USING(lottery_pack_inventory_id) JOIN lottery_packs p ON p.lottery_pack_id=i.pack_id WHERE p.lottery_game_id=g.lottery_game_id AND h.dgt_id=g.dgt_id AND i.last_sold_ticket_number>=i.open_ticket_number) AS "lastSaleDate"
 FROM lottery_games g JOIN stores s ON s.dgt_id=g.dgt_id WHERE g.dgt_id=? ORDER BY g.game_name,g.lottery_game_id
 """,today(store),today(store),today(store),store).stream().map(Rows::normalize).toList());}
 public record Form(String version,String gameName,String gameCode,BigDecimal ticketPrice,BigDecimal ticketsPerPack,BigDecimal commissionPercent,LocalDate startDate,LocalDate endDate,Boolean status,LocalDate commissionEffectiveDate){}
 @PostMapping @Transactional public Object create(@PathVariable String store,@RequestBody Form f){return save(store,null,f);}
 @PutMapping("/{id}") @Transactional public Object update(@PathVariable String store,@PathVariable long id,@RequestBody Form f){return save(store,id,f);}
 private Object save(String store,Long id,Form f){edit(store);a.db.queryForObject("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",String.class,store);
  String name=Objects.toString(f.gameName(),"").trim(),code=Objects.toString(f.gameCode(),"").trim();
  if(name.isEmpty()||name.length()>150||code.isEmpty()||code.length()>50||f.ticketPrice()==null||f.ticketPrice().signum()<=0||f.ticketPrice().stripTrailingZeros().scale()>2||f.ticketPrice().compareTo(new BigDecimal("99999999.99"))>0||f.ticketsPerPack()==null||f.ticketsPerPack().stripTrailingZeros().scale()>0||f.ticketsPerPack().compareTo(BigDecimal.ONE)<0||f.ticketsPerPack().compareTo(BigDecimal.valueOf(1000000))>0||f.commissionPercent()==null||f.commissionPercent().signum()<0||f.commissionPercent().compareTo(BigDecimal.valueOf(100))>0||f.commissionPercent().stripTrailingZeros().scale()>2||f.startDate()==null||f.status()==null)throw bad("Enter a name, code, valid dates, positive price and ticket count, and commission from 0 to 100");
  if(f.endDate()!=null&&f.endDate().isBefore(f.startDate()))throw bad("End date cannot precede start date");
  BigDecimal value=f.ticketPrice().multiply(f.ticketsPerPack());if(value.compareTo(new BigDecimal("9999999999.99"))>0)throw bad("Pack value is too large");
  if(a.db.queryForObject("SELECT count(*) FROM lottery_games WHERE dgt_id=? AND lower(trim(game_code))=lower(?) AND (?::bigint IS NULL OR lottery_game_id<>?)",Integer.class,store,code,id,id)>0)throw bad("Game code already exists in this store");
  if(id==null){id=a.db.queryForObject("INSERT INTO lottery_games(dgt_id,game_name,game_code,ticket_price,tickets_per_pack,pack_value,commission_percent,status,start_date,end_date) VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING lottery_game_id",Long.class,store,name,code,f.ticketPrice(),f.ticketsPerPack().intValueExact(),value,f.commissionPercent(),f.status()?"ACTIVE":"DISCONTINUED",f.startDate(),f.endDate());}
  else{
   var rows=a.db.queryForList("SELECT *,xmin::text AS version FROM lottery_games WHERE dgt_id=? AND lottery_game_id=? FOR UPDATE",store,id);if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Game not found");var old=rows.getFirst();
   if(!Objects.equals(old.get("version"),f.version()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Game changed; refresh before saving");
   boolean hasPacks=a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM lottery_packs WHERE dgt_id=? AND lottery_game_id=?)",Boolean.class,store,id);
   if(hasPacks&&(((BigDecimal)old.get("ticket_price")).compareTo(f.ticketPrice())!=0||((Number)old.get("tickets_per_pack")).intValue()!=f.ticketsPerPack().intValueExact()))throw bad("Price and tickets per pack are locked after packs are received");
   BigDecimal rate=(BigDecimal)old.get("commission_percent"),pending=(BigDecimal)old.get("scheduled_commission_percent");LocalDate effective=old.get("commission_effective_date")==null?null:((java.sql.Date)old.get("commission_effective_date")).toLocalDate();
   if(effective!=null&&!effective.isAfter(today(store))){rate=pending;pending=null;effective=null;}
   if(rate.compareTo(f.commissionPercent())!=0){if(f.commissionEffectiveDate()==null||f.commissionEffectiveDate().isBefore(today(store)))throw bad("Commission changes require today's date or a future effective date");if(f.commissionEffectiveDate().equals(today(store))){rate=f.commissionPercent();pending=null;effective=null;}else{pending=f.commissionPercent();effective=f.commissionEffectiveDate();}}
   a.db.update("UPDATE lottery_games SET game_name=?,game_code=?,ticket_price=?,tickets_per_pack=?,pack_value=?,commission_percent=?,scheduled_commission_percent=?,commission_effective_date=?,status=?,start_date=?,end_date=?,updated_at=CURRENT_TIMESTAMP WHERE lottery_game_id=? AND dgt_id=?",name,code,f.ticketPrice(),f.ticketsPerPack().intValueExact(),value,rate,pending,effective,f.status()?"ACTIVE":"DISCONTINUED",f.startDate(),f.endDate(),id,store);
  }
  a.audit(store,"LOTTERY_GAME_SAVED",id.toString(),json.writeValueAsString(f));return data(store,true);
 }
}
