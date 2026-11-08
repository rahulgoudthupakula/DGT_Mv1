package com.dgt.backend.pos.controller;
import com.dgt.backend.pos.dto.PosTransaction;
import com.dgt.backend.pos.security.PosIdentity;
import com.dgt.backend.pos.security.PosSecurity;
import com.dgt.backend.pos.service.PosIngestionService;
import com.dgt.backend.pos.validation.PosValidation;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.common.entity.Rows;

// Store-admin API for simulator setup, mapping maintenance and ingestion history.
@RestController @RequestMapping("/api/v1/access/stores/{store}/pos")
public class PosAdminController {
 private final ScopedAccess a;private final PosIngestionService service;private final ObjectMapper json;private final boolean enabled;
 public PosAdminController(ScopedAccess a,PosIngestionService service,ObjectMapper json,@Value("${app.pos.simulator-enabled:false}") boolean flag,@Value("${app.environment:production}") String environment){this.a=a;this.service=service;this.json=json;enabled=PosSecurity.simulatorAllowed(flag,environment);}
 // Check both administrator access and connector ownership before changing a connector.
 private void owned(String store,UUID id){a.requireAdmin(store);if(!Boolean.TRUE.equals(a.db.queryForObject("SELECT EXISTS(SELECT 1 FROM pos_connectors WHERE connector_id=? AND dgt_id=?)",Boolean.class,id,store)))throw a.denied();}
 // Simulator writes require the explicit development/testing feature gate.
 private void writable(String store){a.requireAdmin(store);if(!enabled)throw new ResponseStatusException(HttpStatus.FORBIDDEN,"POS simulator is only enabled in development/testing");}
 // Reachability reflects a recent heartbeat only; posConnected stays false for simulated input.
 @GetMapping public Object get(@PathVariable String store){a.requireAdmin(store);return Map.of("simulatorEnabled",enabled,"posConnected",false,"connectors",a.db.queryForList("SELECT connector_id,active,source_system,schedule_minutes,heartbeat_at,heartbeat_at>now()-interval '2 minutes' AS reachable FROM pos_connectors WHERE dgt_id=? ORDER BY created_at",store).stream().map(Rows::normalize).toList(),"mappings",a.db.queryForList("SELECT m.* FROM pos_mappings m JOIN pos_connectors c USING(connector_id) WHERE c.dgt_id=? ORDER BY kind,source_code",store).stream().map(Rows::normalize).toList(),"history",a.db.queryForList("SELECT ingestion_id,connector_id,source_transaction_id,status,reason,sale_id,attempts,created_at,updated_at FROM pos_ingestions WHERE dgt_id=? ORDER BY created_at DESC LIMIT 100",store).stream().map(Rows::normalize).toList(),"events",a.db.queryForList("SELECT e.* FROM pos_sync_events e JOIN pos_connectors c USING(connector_id) WHERE c.dgt_id=? ORDER BY event_id DESC LIMIT 100",store).stream().map(Rows::normalize).toList());}
 // Return the stored normalized contract for review, scoped to this store.
 @GetMapping("/history/{id}") public Object detail(@PathVariable String store,@PathVariable UUID id){a.requireAdmin(store);var rows=a.db.queryForList("SELECT payload::text FROM pos_ingestions WHERE ingestion_id=? AND dgt_id=?",id,store);if(rows.isEmpty())throw a.denied();return json.readTree((String)rows.getFirst().get("payload"));}
 // Supply existing records for mapping selectors; tenders come from the shared active catalog.
 @GetMapping("/targets") public Object targets(@PathVariable String store){a.requireAdmin(store);return Map.of(
  "REGISTER",a.db.queryForList("SELECT terminal_id AS id,terminal_code AS label FROM pos_terminals WHERE store_id=? AND terminal_status='ACTIVE'",store),
  "CASHIER",a.db.queryForList("SELECT DISTINCT e.employee_id AS id,coalesce(e.first_name,u.first_name,'')||' '||coalesce(e.last_name,u.last_name,'') AS label FROM employees e LEFT JOIN users u ON u.user_id=e.user_id JOIN employee_store_assignments s ON s.employee_id=e.employee_id WHERE s.dgt_id=? AND s.effective_from<=CURRENT_DATE AND (s.effective_to IS NULL OR s.effective_to>=CURRENT_DATE) AND (e.termination_date IS NULL OR e.termination_date>=CURRENT_DATE)",store),
  "PRODUCT",a.db.queryForList("SELECT product_id AS id,product_name||' ('||product_sku||')' AS label FROM products WHERE dgt_id=? AND is_active ORDER BY product_name",store),
  "TENDER",a.db.queryForList("SELECT tender_type_id AS id,tender_name AS label FROM tender_types WHERE is_active"));}
 // Return the new random credential once and persist only its SHA-256 hash.
 @PostMapping("/connectors") @Transactional public Object create(@PathVariable String store){writable(store);UUID id=UUID.randomUUID();byte[] bytes=new byte[32];new java.security.SecureRandom().nextBytes(bytes);String key=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);a.db.update("INSERT INTO pos_connectors(connector_id,dgt_id,credential_hash) VALUES (?,?,?)",id,store,PosSecurity.hash(key));a.audit(store,"POS_CONNECTOR_CREATED",id.toString(),"{}");return Map.of("connectorId",id,"credential",key);}
 // A schedule of zero means manual synchronization; other allowed values are minutes.
 public record Settings(int scheduleMinutes){}
 // Validate the polling interval and audit the configuration change.
 @PutMapping("/connectors/{id}") @Transactional public Object schedule(@PathVariable String store,@PathVariable UUID id,@RequestBody Settings in){writable(store);owned(store,id);if(!Set.of(0,5,15,30,60).contains(in.scheduleMinutes()))PosValidation.bad("Invalid schedule");a.db.update("UPDATE pos_connectors SET schedule_minutes=? WHERE connector_id=?",in.scheduleMinutes(),id);a.audit(store,"POS_SCHEDULE_UPDATED",id.toString(),json.writeValueAsString(in));return Map.of("ok",true);}
 // Deactivate the credential so later connector requests cannot authenticate.
 @PostMapping("/connectors/{id}/revoke") @Transactional public Object revoke(@PathVariable String store,@PathVariable UUID id){a.requireAdmin(store);owned(store,id);a.db.update("UPDATE pos_connectors SET active=false WHERE connector_id=?",id);a.audit(store,"POS_CONNECTOR_REVOKED",id.toString(),"{}");return Map.of("ok",true);}
 // Bind one connector source code to an existing register, cashier, product or tender ID.
 public record Mapping(String kind,String sourceCode,long targetId){}
 // Validate the target before inserting or replacing this connector-specific mapping.
 @PutMapping("/connectors/{id}/mapping") @Transactional public Object mapping(@PathVariable String store,@PathVariable UUID id,@RequestBody Mapping in){writable(store);owned(store,id);PosValidation.text(in.sourceCode(),100);if(!service.targetValid(store,in.kind(),in.targetId(),java.time.LocalDate.now()))PosValidation.bad("Invalid mapping target for this store");a.db.update("INSERT INTO pos_mappings(connector_id,kind,source_code,target_id) VALUES (?,?,?,?) ON CONFLICT(connector_id,kind,source_code) DO UPDATE SET target_id=excluded.target_id",id,in.kind(),in.sourceCode(),in.targetId());a.audit(store,"POS_MAPPING_UPDATED",id.toString(),json.writeValueAsString(in));return Map.of("ok",true);}
 // Explicit administrator retry runs the saved contract through the ingestion checks again.
 @PostMapping("/history/{id}/reprocess") public Object retry(@PathVariable String store,@PathVariable UUID id){writable(store);var rows=a.db.queryForList("SELECT connector_id,payload::text FROM pos_ingestions WHERE ingestion_id=? AND dgt_id=?",id,store);if(rows.isEmpty())throw a.denied();var row=rows.getFirst();var result=service.ingest(new PosIdentity((UUID)row.get("connector_id"),store),json.readValue((String)row.get("payload"),PosTransaction.class),true);a.audit(store,"POS_REPROCESSED",id.toString(),"{}");return result;}
}
