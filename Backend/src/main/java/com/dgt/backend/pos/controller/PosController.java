package com.dgt.backend.pos.controller;
import com.dgt.backend.pos.dto.PosTransaction;
import com.dgt.backend.pos.security.PosIdentity;
import com.dgt.backend.pos.service.PosIngestionService;
import com.dgt.backend.pos.validation.PosValidation;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.*;

// Connector-only API; authentication supplies a store-bound PosIdentity.
@RestController @RequestMapping("/api/v1/pos")
public class PosController {
 private final PosIngestionService service;private final JdbcTemplate db;private final ObjectMapper json;
 public PosController(PosIngestionService service,JdbcTemplate db,ObjectMapper json){this.service=service;this.db=db;this.json=json;}
 // Use the authenticated connector identity rather than trusting a submitted store ID.
 private PosIdentity identity(Authentication a){return (PosIdentity)a.getPrincipal();}
 // Allow only named contract fields, including nested item/payment records, before deserialization.
 private static void fields(JsonNode node,Class<?> type){
  if(node==null||!node.isObject())PosValidation.bad("Expected transaction object");
  Set<String> allowed=new HashSet<>();for(var field:type.getRecordComponents())allowed.add(field.getName());
  for(String key:node.propertyNames())if(!allowed.contains(key))PosValidation.bad("Unexpected transaction field");
 }
 // Validate the allowlist and translate ingestion outcomes into accepted, held or duplicate responses.
 @PostMapping("/sales") public ResponseEntity<?> sale(Authentication auth,@RequestBody JsonNode body){
  fields(body,PosTransaction.class);
  if(body.path("items").isArray())for(var i:body.path("items"))fields(i,PosTransaction.Item.class);
  if(body.path("payments").isArray())for(var p:body.path("payments"))fields(p,PosTransaction.Payment.class);
  PosTransaction transaction;
  // Reject malformed contract values without exposing parser details in the response.
  try{transaction=json.treeToValue(body,PosTransaction.class);}catch(Exception e){throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,"Invalid transaction format");}
  var result=service.ingest(identity(auth),transaction,false);
  return ResponseEntity.status(result.outcome().equals("ACCEPTED")?201:result.outcome().equals("HELD")?202:200).body(result);
 }
 // Return the authenticated connector configuration without returning its credential hash.
 @GetMapping("/configuration") public Object configuration(Authentication a){return db.queryForMap("SELECT dgt_id AS \"dgtId\",source_system AS \"sourceSystem\",schedule_minutes AS \"scheduleMinutes\" FROM pos_connectors WHERE connector_id=? AND active",identity(a).id());}
 // Record connector reachability; a heartbeat does not establish a real Commander connection.
 @PostMapping("/heartbeat") public Object heartbeat(Authentication a){db.update("UPDATE pos_connectors SET heartbeat_at=now() WHERE connector_id=? AND active",identity(a).id());return Map.of("ok",true,"posConnected",false);}
}
