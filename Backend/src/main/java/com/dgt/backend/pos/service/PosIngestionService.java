package com.dgt.backend.pos.service;
import com.dgt.backend.pos.dto.PosTransaction;
import com.dgt.backend.pos.security.PosIdentity;
import com.dgt.backend.pos.security.PosSecurity;
import com.dgt.backend.pos.validation.PosValidation;

import java.util.*;
import java.sql.Timestamp;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

// Import normalized sales atomically into existing sales tables without changing inventory.
@Service
public class PosIngestionService {
 private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(PosIngestionService.class);
 private final JdbcTemplate db;private final ObjectMapper json;
 public PosIngestionService(JdbcTemplate db,ObjectMapper json){this.db=db;this.json=json;}
 // Return a stable ingestion identity and, when accepted or duplicated, the existing sale ID.
 public record Result(String outcome,UUID ingestionId,Long saleId,String reason){}
 // Log identifiers/outcome only; store the controlled diagnostic detail in sync history.
 private void event(UUID connector,UUID id,String result,String detail){log.atInfo().addKeyValue("connectorId",connector).addKeyValue("ingestionId",id).addKeyValue("result",result).log("POS ingestion");db.update("INSERT INTO pos_sync_events(connector_id,ingestion_id,result,detail) VALUES (?,?,?,?)",connector,id,result,detail);}
 // Check active targets and store ownership; cashier eligibility is evaluated for the supplied date.
 public boolean targetValid(String store,String kind,long id,java.time.LocalDate date){
  if(kind==null)return false;
  return switch(kind){
   case "REGISTER"->Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM pos_terminals WHERE terminal_id=? AND store_id=? AND terminal_status='ACTIVE')",Boolean.class,id,store));
   case "CASHIER"->Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM employees e JOIN employee_store_assignments a USING(employee_id) WHERE e.employee_id=? AND a.dgt_id=? AND a.effective_from<=? AND (a.effective_to IS NULL OR a.effective_to>=?) AND e.hire_date<=? AND (e.termination_date IS NULL OR e.termination_date>=?))",Boolean.class,id,store,date,date,date,date));
   case "PRODUCT"->Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM products WHERE product_id=? AND dgt_id=? AND is_active)",Boolean.class,id,store));
   case "TENDER"->Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM tender_types WHERE tender_type_id=? AND is_active)",Boolean.class,id));
   default->false;
  };
 }
 // Resolve exactly one explicit connector mapping and revalidate its target before use.
 private Long mapped(PosIdentity c,String kind,String code,java.time.LocalDate date){
  if(code==null)return null;
  var ids=db.queryForList("SELECT target_id FROM pos_mappings WHERE connector_id=? AND kind=? AND source_code=?",Long.class,c.id(),kind,code);
  return ids.size()==1&&targetValid(c.store(),kind,ids.getFirst(),date)?ids.getFirst():null;
 }
 // The receipt, sale header, items, payments and sync event commit or roll back together.
 @Transactional
 public Result ingest(PosIdentity c,PosTransaction t,boolean reprocess){
  PosValidation.validate(t);
  if(!c.store().equals(t.dgtId()))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Connector belongs to another store");
  // Lock the active connector while ingesting and reject revoked or mismatched identities.
  var connectors=db.queryForList("SELECT connector_id FROM pos_connectors WHERE connector_id=? AND dgt_id=? AND active FOR UPDATE",c.id(),c.store());
  if(connectors.isEmpty())throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
  if(!Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM stores s JOIN companies c USING(company_id) WHERE s.dgt_id=? AND c.is_active)",Boolean.class,c.store())))throw new ResponseStatusException(HttpStatus.FORBIDDEN);
  // Fingerprint the serialized normalized contract, not a raw vendor payload.
  String payload=json.writeValueAsString(t);String hash=PosSecurity.hash(payload);
  // Lock source identity across connectors too; uniqueness remains enforced by PostgreSQL.
  db.queryForList("SELECT pg_advisory_xact_lock(hashtextextended(?,0))",c.store()+":"+t.sourceSystem()+":"+t.sourceTransactionId());
  var existing=db.queryForList("SELECT * FROM pos_ingestions WHERE dgt_id=? AND source_system=? AND source_transaction_id=? FOR UPDATE",c.store(),t.sourceSystem(),t.sourceTransactionId());
  UUID id;
  if(!existing.isEmpty()){
   var old=existing.getFirst();id=(UUID)old.get("ingestion_id");
   // Reused source identities must have identical serialized content; changed content is a conflict.
   if(!hash.equals(old.get("payload_hash")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Source identity already contains different transaction data");
   if(old.get("sale_id")!=null){event(c.id(),id,"DUPLICATE",null);return new Result("DUPLICATE",id,((Number)old.get("sale_id")).longValue(),null);}
   // Automatic retries leave held records on hold until an administrator explicitly reprocesses them.
   if(!reprocess)return new Result((String)old.get("status"),id,null,(String)old.get("reason"));
   db.update("UPDATE pos_ingestions SET attempts=attempts+1,updated_at=now() WHERE ingestion_id=?",id);
  }else{
   id=UUID.randomUUID();db.update("INSERT INTO pos_ingestions(ingestion_id,connector_id,dgt_id,source_system,source_transaction_id,payload_hash,payload,status) VALUES (?,?,?,?,?,?,?::jsonb,'HELD')",id,c.id(),c.store(),t.sourceSystem(),t.sourceTransactionId(),hash,payload);
  }
  // Evaluate historical cashier assignment using the sale date in the store timezone.
  String zone=db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,c.store());
  var date=t.saleDateTime().atZoneSameInstant(java.time.ZoneId.of(zone)).toLocalDate();
  Long terminal=mapped(c,"REGISTER",t.registerCode(),date),cashier=mapped(c,"CASHIER",t.cashierCode(),date);
  List<Long> products=new ArrayList<>(),tenders=new ArrayList<>();
  // Referenced corrections require lifecycle review even when ordinary mappings are available.
  String reason=t.originalTransactionId()!=null?"Referenced correction requires lifecycle review":terminal==null?"Register mapping required":cashier==null?"Cashier mapping required":null;
  // Prefer an explicit product mapping; otherwise accept only a unique active store barcode match.
  for(var item:t.items()){
   Long product=mapped(c,"PRODUCT",item.productCode(),date);
   if(product==null&&item.barcode()!=null){var found=db.queryForList("SELECT DISTINCT p.product_id FROM products p JOIN product_barcodes b ON b.product_id=p.product_id AND b.dgt_id=p.dgt_id WHERE p.dgt_id=? AND b.product_barcode_value=? AND b.archived_at IS NULL AND p.is_active",Long.class,c.store(),item.barcode());if(found.size()==1)product=found.getFirst();}
   products.add(product);if(product==null)reason="Product mapping missing or ambiguous";
  }
  for(var payment:t.payments()){Long tender=mapped(c,"TENDER",payment.tenderCode(),date);tenders.add(tender);if(tender==null)reason="Tender mapping required";}
  // Serialize receipt-number checks to avoid importing two source identities as the same receipt.
  db.queryForList("SELECT pg_advisory_xact_lock(hashtextextended(?,0))",c.store()+":receipt:"+t.receiptNo());
  if(Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM sales WHERE store_id=? AND receipt_no=?)",Boolean.class,c.store(),t.receiptNo())))reason="Receipt number already exists in this store; review source identity";
  // Persist the entire transaction on hold before writing any sales rows.
  if(reason!=null){db.update("UPDATE pos_ingestions SET reason=?,updated_at=now() WHERE ingestion_id=?",reason,id);event(c.id(),id,"HELD",reason);return new Result("HELD",id,null,reason);}
  // Use an internal UUID-based transaction ID to preserve global sales identifier uniqueness.
  Long sale=db.queryForObject("INSERT INTO sales(store_id,cashier_id,terminal_id,receipt_no,transaction_id,transaction_type,sale_status,sale_datetime,subtotal,taxable_amount,tax_amount,discount_amount,total_amount,total_items) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING sale_id",Long.class,c.store(),cashier,terminal,t.receiptNo(),"POS-"+id,t.transactionType(),t.saleStatus(),Timestamp.from(t.saleDateTime().toInstant()),t.subtotal(),t.taxableAmount(),t.taxAmount(),t.discountAmount(),t.totalAmount(),t.totalItems());
  // Insert all items using the targets resolved above; any insert failure rolls back the transaction.
  for(int n=0;n<t.items().size();n++){var i=t.items().get(n);db.update("INSERT INTO sales_items(sale_id,product_id,quantity,catalog_price,unit_price,gross_amount,discount_amount,taxable_amount,tax_amount,line_total) VALUES (?,?,?,?,?,?,?,?,?,?)",sale,products.get(n),i.quantity(),i.catalogPrice(),i.unitPrice(),i.grossAmount(),i.discountAmount(),i.taxableAmount(),i.taxAmount(),i.lineTotal());}
  // Persist normalized tender amounts and brand metadata, without payment-processing credentials.
  for(int n=0;n<t.payments().size();n++){var p=t.payments().get(n);db.update("INSERT INTO sale_payments(sale_id,tender_type_id,payment_amount,payment_status,card_brand,payment_datetime) VALUES (?,?,?,?,?,?)",sale,tenders.get(n),p.paymentAmount(),p.paymentStatus(),p.cardBrand(),Timestamp.from(t.saleDateTime().toInstant()));}
  // Link the completed sale to its receipt so a retry can return the same sale without reinserting it.
  db.update("UPDATE pos_ingestions SET status='ACCEPTED',reason=NULL,sale_id=?,updated_at=now() WHERE ingestion_id=?",sale,id);
  event(c.id(),id,"ACCEPTED",null);return new Result("ACCEPTED",id,sale,null);
 }
}
