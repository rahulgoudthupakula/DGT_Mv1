package com.dgt.backend.portal;
import java.util.*;import org.springframework.web.bind.annotation.*;import com.dgt.backend.access.security.ScopedAccess;
import lombok.extern.slf4j.Slf4j;
// Store-facing support API that forwards commands to the client-handling backend.
// The portal owns ticket persistence; this gateway supplies authenticated store/user context.
@Slf4j
@RestController @RequestMapping("/api/v1/access/stores/{store}/support-tickets")
public class SupportGatewayController {
 private final PortalBridge p;private final ScopedAccess a;
 public SupportGatewayController(PortalBridge p,ScopedAccess a){this.p=p;this.a=a;}
 // Require store assignment and derive store, company, and user identity server-side.
 private Map<String,Object> context(String store,String operation,Long id,Object body,UUID key){a.assigned(store);var s=a.db.queryForMap("SELECT store_name,company_id FROM stores WHERE dgt_id=?",store);var data=new HashMap<String,Object>();data.put("storeId",store);data.put("storeName",s.get("store_name"));data.put("companyId",s.get("company_id"));data.put("userId",a.user());data.put("operation",operation);data.put("ticketId",id);data.put("body",body);data.put("requestKey",key);return data;}
 // Request this store ticket list through the internal support command endpoint.
 @GetMapping public Object list(@PathVariable String store){return p.call("/support",context(store,"LIST",null,null,null));}
 // Forward ticket creation with the caller UUID key for portal-side retry handling.
 @PostMapping public Object create(@PathVariable String store,@RequestHeader("Idempotency-Key") UUID key,@RequestBody Map<String,Object> in){return p.call("/support",context(store,"CREATE",null,in,key));}
 // Request messages for the selected ticket using the authorized store context.
 @GetMapping("/{id}/messages") public Object messages(@PathVariable String store,@PathVariable long id){return p.call("/support",context(store,"MESSAGES",id,null,null));}
 // Forward a reply and its request key; ticket-level validation belongs to the portal.
 @PostMapping("/{id}/messages") public Object reply(@PathVariable String store,@PathVariable long id,@RequestHeader("Idempotency-Key") UUID key,@RequestBody Map<String,Object> in){return p.call("/support",context(store,"REPLY",id,in,key));}
 // Forward a status-change command; the portal validates allowed transitions.
 @PostMapping("/{id}/status") public Object status(@PathVariable String store,@PathVariable long id,@RequestBody Map<String,Object> in){return p.call("/support",context(store,"STATUS",id,in,null));}
}
