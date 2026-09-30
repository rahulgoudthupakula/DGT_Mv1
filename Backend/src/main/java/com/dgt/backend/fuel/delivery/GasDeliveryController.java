package com.dgt.backend.fuel.delivery;

import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@ConditionalOnProperty(name="app.gas.delivery.enabled", havingValue="true")
@RequestMapping("/api/v1/access/stores/{store}/gas-deliveries")
public class GasDeliveryController {
    private final ScopedAccess a;
    private final ObjectMapper json;
    public GasDeliveryController(ScopedAccess a, ObjectMapper json) { this.a=a; this.json=json; }
    private static final String VIEW="GAS_VIEW_DELIVERIES", RECORD="GAS_RECORD_DELIVERY", RECEIVE="GAS_RECEIVE_DELIVERY";
    private boolean allowed(String store,String code) {
        long user=a.user(); if(a.admin(user,a.company(store)))return true;
        return Boolean.TRUE.equals(a.db.queryForObject("""
            SELECT EXISTS(SELECT 1 FROM user_roles r JOIN role_types t USING(role_type_id)
            JOIN store_role_permissions p ON p.dgt_id=r.dgt_id AND p.role_type_id=r.role_type_id
            WHERE r.user_id=? AND r.dgt_id=? AND r.is_active AND t.is_active
            AND upper(t.role_type_name) IN ('MANAGER','CASHIER','ACCOUNTANT') AND p.permission_code=? AND p.allowed)
            """,Boolean.class,user,store,code));
    }
    private void access(String store,String code) { if(!allowed(store,code))throw a.denied(); }
    private void readAccess(String store) { if(!allowed(store,VIEW)&&!allowed(store,RECORD)&&!allowed(store,RECEIVE))throw a.denied(); }
    private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
    private ResponseStatusException conflict(String message){return new ResponseStatusException(HttpStatus.CONFLICT,message);}
    private void lockStore(String store){a.db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",store);}
    private long id(String value,String label){if(value==null||!value.matches("[1-9][0-9]{0,17}"))throw bad("Choose a valid "+label);return Long.parseLong(value);}
    private String text(String value,int max,boolean required,String label){String result=value==null?"":value.trim();if((required&&result.isEmpty())||result.length()>max)throw bad(label+" is "+(required?"required and ":"")+"limited to "+max+" characters");return result;}
    private BigDecimal number(BigDecimal n,int precision,int scale,boolean positive,String label){
        if(n==null){if(positive)throw bad(label+" is required");return null;}
        if((positive&&n.signum()<=0)||n.abs().compareTo(BigDecimal.TEN.pow(precision-scale))>=0||n.stripTrailingZeros().scale()>scale)throw bad("Invalid "+label);
        return n;
    }
    private LocalDate today(String store){String zone=a.db.queryForObject("SELECT timezone FROM stores WHERE dgt_id=?",String.class,store);try{return LocalDate.now(ZoneId.of(zone));}catch(Exception ex){throw bad("Set a valid store timezone first");}}
    public record Header(String bolNumber,String folio,LocalDate loadDate,LocalTime loadTime,String terminal,String supplier,String customer,String destination,String carrier,String driver,String tractor,String trailer,String notes) {}
    public record Line(String productCode,String description,BigDecimal octane,BigDecimal grossGallons,BigDecimal netGallons,BigDecimal temperature,BigDecimal gravity,String meter,String compartment,String tank,String gradeId) {}
    public record Input(Header header,List<Line> lines,boolean receive) {}
    private static final String HEADER_SQL="""
        SELECT d.*,d.delivery_id::text AS id,d.xmin::text AS version,v.vendor_name AS "vendorName",
        concat_ws(' ',u.first_name,u.last_name) AS "createdBy",concat_ws(' ',r.first_name,r.last_name) AS "receivedBy"
        FROM fuel_deliveries d JOIN vendors v ON v.vendor_id=d.vendor_id AND v.dgt_id=d.dgt_id
        JOIN users u ON u.user_id=d.created_by LEFT JOIN users r ON r.user_id=d.received_by
        """;
    private List<Map<String,Object>> lines(String store,Long deliveryId){return a.db.queryForList("""
        SELECT l.delivery_id::text AS "deliveryId",l.delivery_line_id::text AS id,l.delivery_line_id::text AS key,
        l.product_code AS "productCode",l.description,l.octane,l.gross_gallons AS "grossGallons",l.net_gallons AS "netGallons",
        l.temperature,l.gravity,l.meter,l.compartment,l.tank_id::text AS tank,l.fuel_grade_id::text AS "gradeId",
        g.grade_name AS "gradeName",g.fuel_type AS "fuelType",t.tank_number AS "tankNumber",t.tank_name AS "tankName"
        FROM fuel_delivery_lines l JOIN fuel_grades g ON g.fuel_grade_id=l.fuel_grade_id
        JOIN fuel_tanks t ON t.tank_id=l.tank_id AND t.dgt_id=l.dgt_id
        WHERE l.archived_at IS NULL AND l.dgt_id=? AND (?::bigint IS NULL OR l.delivery_id=?) ORDER BY l.delivery_id,l.line_number
        """,store,deliveryId,deliveryId).stream().map(Rows::normalize).toList();}
    private Map<String,Object> format(Map<String,Object> r,List<Map<String,Object>> lines){
        var h=new LinkedHashMap<String,Object>();
        String[][] fields={{"bolNumber","bol_number"},{"folio","folio"},{"loadDate","load_date"},{"loadTime","load_time"},{"terminal","terminal"},{"supplier","vendor_id"},{"customer","customer_account"},{"destination","destination"},{"carrier","carrier_name"},{"driver","driver_name"},{"tractor","tractor_number"},{"trailer","trailer_number"},{"notes","notes"}};
        for(var f:fields)h.put(f[0],r.get(f[1])==null?"":r.get(f[1]).toString());
        var result=new LinkedHashMap<String,Object>();result.put("id",r.get("id"));result.put("version",r.get("version"));result.put("status",r.get("status"));result.put("header",h);result.put("lines",lines);result.put("vendorName",r.get("vendorName"));result.put("receivedAt",r.get("received_at"));result.put("receivedBy",r.get("receivedBy"));result.put("createdBy",r.get("createdBy"));result.put("createdAt",r.get("created_at"));return Rows.normalize(result);
    }
    private Map<String,Object> detail(String store,long deliveryId){var rows=a.db.queryForList(HEADER_SQL+" WHERE d.dgt_id=? AND d.delivery_id=?",store,deliveryId);if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Delivery not found in this store");return format(rows.getFirst(),lines(store,deliveryId));}
    @GetMapping @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Object list(@PathVariable String store){
        readAccess(store);var allLines=lines(store,null);var deliveries=a.db.queryForList(HEADER_SQL+" WHERE d.dgt_id=? ORDER BY d.load_date DESC,d.delivery_id DESC",store).stream().map(r->format(r,allLines.stream().filter(l->Objects.equals(l.get("deliveryId"),r.get("id"))).toList())).toList();
        return Map.of("deliveries",deliveries,"canEdit",allowed(store,RECORD),"canReceive",allowed(store,RECEIVE),"today",today(store).toString());
    }
    @GetMapping("/options") @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Object options(@PathVariable String store){
        readAccess(store);
        var assignments=a.db.queryForList("SELECT x.tank_id::text AS tank,x.fuel_grade_id::text AS \"gradeId\",g.grade_name AS \"gradeName\",g.fuel_type AS \"fuelType\",g.octane_rating AS octane,x.effective_from AS \"effectiveFrom\",x.effective_to AS \"effectiveTo\" FROM fuel_tank_grade_assignments x JOIN fuel_tanks t USING(tank_id) JOIN fuel_grades g ON g.fuel_grade_id=x.fuel_grade_id WHERE t.dgt_id=? AND g.is_active ORDER BY x.effective_from",store).stream().map(Rows::normalize).toList();
        var tanks=a.db.queryForList("SELECT tank_id::text AS id,tank_number AS number,tank_name AS name,capacity_gallons AS capacity FROM fuel_tanks WHERE dgt_id=? ORDER BY tank_number,tank_id",store);
        for(var t:tanks)t.put("assignments",assignments.stream().filter(x->Objects.equals(x.get("tank"),t.get("id"))).toList());
        return Map.of("vendors",a.db.queryForList("SELECT vendor_id::text AS id,vendor_name AS name FROM vendors WHERE dgt_id=? AND is_active ORDER BY vendor_name,vendor_id",store),"tanks",tanks);
    }
    @GetMapping("/{deliveryId}") @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Object get(@PathVariable String store,@PathVariable long deliveryId){readAccess(store);return detail(store,deliveryId);}
    private Header validate(String store,Input in){
        if(in==null||in.header()==null||in.lines()==null||in.lines().isEmpty()||in.lines().size()>100)throw bad("Enter BOL details and 1–100 product lines");
        var h=in.header();long vendor=id(h.supplier(),"supplier");if(a.db.queryForList("SELECT vendor_id FROM vendors WHERE vendor_id=? AND dgt_id=? AND is_active FOR SHARE",vendor,store).isEmpty())throw bad("Supplier is not active in this store");
        if(h.loadDate()==null||h.loadDate().isBefore(LocalDate.of(1900,1,1))||h.loadDate().isAfter(LocalDate.of(9999,12,31)))throw bad("Enter a valid load date");
        if(h.loadTime()!=null&&h.loadTime().getNano()!=0)throw bad("Invalid load time");
        Header valid=new Header(text(h.bolNumber(),100,true,"BOL number"),text(h.folio(),100,false,"Folio"),h.loadDate(),h.loadTime(),text(h.terminal(),250,false,"Terminal"),Long.toString(vendor),text(h.customer(),250,false,"Customer / account"),text(h.destination(),500,false,"Destination"),text(h.carrier(),200,false,"Carrier"),text(h.driver(),200,false,"Driver"),text(h.tractor(),100,false,"Tractor"),text(h.trailer(),100,false,"Trailer"),text(h.notes(),10000,false,"Notes"));
        var tankTotals=new HashMap<Long,BigDecimal>();
        for(var l:in.lines()){
            if(l==null)throw bad("Invalid product line");long tank=id(l.tank(),"tank"),grade=id(l.gradeId(),"fuel grade");
            var tanks=a.db.queryForList("SELECT capacity_gallons FROM fuel_tanks WHERE tank_id=? AND dgt_id=? FOR UPDATE",tank,store);if(tanks.isEmpty())throw bad("Tank does not belong to this store");
            var assigned=a.db.queryForList("SELECT x.fuel_grade_id FROM fuel_tank_grade_assignments x JOIN fuel_grades g ON g.fuel_grade_id=x.fuel_grade_id WHERE x.tank_id=? AND x.effective_from<=? AND (x.effective_to IS NULL OR x.effective_to>=?) AND g.is_active",Long.class,tank,h.loadDate(),h.loadDate());
            if(assigned.size()!=1||assigned.getFirst()!=grade)throw conflict("The selected tank must have one matching fuel grade on the load date. Check Gas Settings");
            text(l.productCode(),100,false,"Product code");text(l.description(),300,true,"Description");text(l.meter(),100,false,"Meter");text(l.compartment(),100,false,"Compartment");
            number(l.octane(),5,2,false,"Octane");if(l.octane()!=null&&l.octane().signum()<0)throw bad("Invalid octane");
            number(l.grossGallons(),12,3,true,"Gross gallons");number(l.netGallons(),14,3,true,"Net gallons");number(l.temperature(),7,3,false,"Temperature");number(l.gravity(),7,3,false,"Gravity");
            BigDecimal total=tankTotals.merge(tank,l.grossGallons(),BigDecimal::add);if(total.compareTo((BigDecimal)tanks.getFirst().get("capacity_gallons"))>0)throw bad("This delivery's gallons exceed the selected tank's total capacity");
        }
        return valid;
    }
    private void saveLines(String store,long deliveryId,List<Line> rows){
        a.db.update("UPDATE fuel_delivery_lines SET archived_at=CURRENT_TIMESTAMP WHERE archived_at IS NULL AND delivery_id=? AND dgt_id=?",deliveryId,store);int index=0;
        for(var l:rows)a.db.update("INSERT INTO fuel_delivery_lines(delivery_id,dgt_id,line_number,tank_id,fuel_grade_id,product_code,description,octane,gross_gallons,net_gallons,temperature,gravity,meter,compartment) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(delivery_id,line_number) DO UPDATE SET tank_id=EXCLUDED.tank_id,fuel_grade_id=EXCLUDED.fuel_grade_id,product_code=EXCLUDED.product_code,description=EXCLUDED.description,octane=EXCLUDED.octane,gross_gallons=EXCLUDED.gross_gallons,net_gallons=EXCLUDED.net_gallons,temperature=EXCLUDED.temperature,gravity=EXCLUDED.gravity,meter=EXCLUDED.meter,compartment=EXCLUDED.compartment,archived_at=NULL",deliveryId,store,++index,id(l.tank(),"tank"),id(l.gradeId(),"fuel grade"),text(l.productCode(),100,false,"Product code"),l.description().trim(),l.octane(),l.grossGallons(),l.netGallons(),l.temperature(),l.gravity(),text(l.meter(),100,false,"Meter"),text(l.compartment(),100,false,"Compartment"));
    }
    private void uniqueBol(String store,Header h,Long exclude){if(!a.db.queryForList("SELECT delivery_id FROM fuel_deliveries WHERE dgt_id=? AND vendor_id=? AND lower(trim(bol_number))=lower(?) AND (?::bigint IS NULL OR delivery_id<>?)",store,id(h.supplier(),"supplier"),h.bolNumber(),exclude,exclude).isEmpty())throw conflict("This supplier's BOL number is already saved in this store. Open the existing delivery");}
    private String hash(Input in){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(json.writeValueAsString(in).getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
    private void recordAudit(String store,String event,long deliveryId,Object before,Object after){var change=new LinkedHashMap<String,Object>();change.put("before",before);change.put("after",after);a.audit(store,event,Long.toString(deliveryId),json.writeValueAsString(change));}
    @PostMapping @Transactional
    public Object create(@PathVariable String store,@RequestHeader("Idempotency-Key") UUID requestId,@RequestBody Input in){
        access(store,RECORD);if(in!=null&&in.receive())access(store,RECEIVE);lockStore(store);access(store,RECORD);if(in!=null&&in.receive())access(store,RECEIVE);
        String hash=hash(in);var old=a.db.queryForList("SELECT delivery_id,request_hash FROM fuel_deliveries WHERE dgt_id=? AND client_request_id=?",store,requestId);
        if(!old.isEmpty()){if(!hash.equals(old.getFirst().get("request_hash")))throw conflict("This save request was already used for different details");return detail(store,((Number)old.getFirst().get("delivery_id")).longValue());}
        Header h=validate(store,in);uniqueBol(store,h,null);
        Long deliveryId=a.db.queryForObject("INSERT INTO fuel_deliveries(dgt_id,vendor_id,client_request_id,request_hash,bol_number,folio,load_date,load_time,terminal,customer_account,destination,carrier_name,driver_name,tractor_number,trailer_number,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING delivery_id",Long.class,store,id(h.supplier(),"supplier"),requestId,hash,h.bolNumber(),h.folio(),h.loadDate(),h.loadTime(),h.terminal(),h.customer(),h.destination(),h.carrier(),h.driver(),h.tractor(),h.trailer(),h.notes(),a.user());
        saveLines(store,deliveryId,in.lines());recordAudit(store,"GAS_DELIVERY_CREATED",deliveryId,null,detail(store,deliveryId));
        if(in.receive())postReceipt(store,deliveryId);
        return detail(store,deliveryId);
    }
    private Map<String,Object> locked(String store,long deliveryId){var rows=a.db.queryForList("SELECT *,xmin::text AS version FROM fuel_deliveries WHERE dgt_id=? AND delivery_id=? FOR UPDATE",store,deliveryId);if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Delivery not found in this store");return rows.getFirst();}
    @PutMapping("/{deliveryId}") @Transactional
    public Object update(@PathVariable String store,@PathVariable long deliveryId,@RequestHeader(value="If-Match",required=false)String version,@RequestBody Input in){
        access(store,RECORD);if(in!=null&&in.receive())access(store,RECEIVE);lockStore(store);access(store,RECORD);if(in!=null&&in.receive())access(store,RECEIVE);
        var row=locked(store,deliveryId);if(!"DRAFT".equals(row.get("status")))throw conflict("Received deliveries cannot be edited");if(!Objects.equals(version,row.get("version")))throw conflict("Delivery changed; close and reopen the latest record");
        var before=detail(store,deliveryId);Header h=validate(store,in);uniqueBol(store,h,deliveryId);
        a.db.update("UPDATE fuel_deliveries SET vendor_id=?,bol_number=?,folio=?,load_date=?,load_time=?,terminal=?,customer_account=?,destination=?,carrier_name=?,driver_name=?,tractor_number=?,trailer_number=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE delivery_id=? AND dgt_id=?",id(h.supplier(),"supplier"),h.bolNumber(),h.folio(),h.loadDate(),h.loadTime(),h.terminal(),h.customer(),h.destination(),h.carrier(),h.driver(),h.tractor(),h.trailer(),h.notes(),deliveryId,store);
        saveLines(store,deliveryId,in.lines());recordAudit(store,"GAS_DELIVERY_UPDATED",deliveryId,before,detail(store,deliveryId));if(in.receive())postReceipt(store,deliveryId);return detail(store,deliveryId);
    }
    @PostMapping("/{deliveryId}/receive") @Transactional
    public Object receive(@PathVariable String store,@PathVariable long deliveryId,@RequestHeader(value="If-Match",required=false)String version){
        access(store,RECEIVE);lockStore(store);access(store,RECEIVE);var row=locked(store,deliveryId);
        if("RECEIVED".equals(row.get("status")))return detail(store,deliveryId);
        if(!Objects.equals(version,row.get("version")))throw conflict("Delivery changed; close and reopen before confirming");postReceipt(store,deliveryId);return detail(store,deliveryId);
    }
    private void postReceipt(String store,long deliveryId){
        var row=locked(store,deliveryId);if(!"DRAFT".equals(row.get("status")))throw conflict("Delivery is already received");
        LocalDate loadDate=((java.sql.Date)row.get("load_date")).toLocalDate();if(loadDate.isAfter(today(store)))throw bad("A future-dated load cannot be confirmed as received");
        // Revalidate saved data immediately before posting, including supplier and dated tank assignment.
        var saved=detail(store,deliveryId);Header header=new Header((String)row.get("bol_number"),(String)row.get("folio"),loadDate,row.get("load_time")==null?null:((java.sql.Time)row.get("load_time")).toLocalTime(),(String)row.get("terminal"),row.get("vendor_id").toString(),(String)row.get("customer_account"),(String)row.get("destination"),(String)row.get("carrier_name"),(String)row.get("driver_name"),(String)row.get("tractor_number"),(String)row.get("trailer_number"),(String)row.get("notes"));
        // Empty time fields in the browser payload are represented as null on writes.
        var rows=a.db.queryForList("SELECT * FROM fuel_delivery_lines WHERE fuel_delivery_lines.archived_at IS NULL AND delivery_id=? AND dgt_id=? ORDER BY line_number",deliveryId,store);
        var validatedLines=new ArrayList<Line>();for(var l:rows)validatedLines.add(new Line((String)l.get("product_code"),(String)l.get("description"),(BigDecimal)l.get("octane"),(BigDecimal)l.get("gross_gallons"),(BigDecimal)l.get("net_gallons"),(BigDecimal)l.get("temperature"),(BigDecimal)l.get("gravity"),(String)l.get("meter"),(String)l.get("compartment"),l.get("tank_id").toString(),l.get("fuel_grade_id").toString()));
        validate(store,new Input(header,validatedLines,false));
        for(var l:rows)a.db.update("INSERT INTO inventory_movements(dgt_id,product_id,movement_type,qty_changed,unit_cost,reference_id,tank_id,fuel_grade_id,fuel_delivery_line_id,net_gallons) VALUES (?,NULL,'FUEL_DELIVERY',?,NULL,?,?,?,?,?)",store,l.get("gross_gallons"),deliveryId,l.get("tank_id"),l.get("fuel_grade_id"),l.get("delivery_line_id"),l.get("net_gallons"));
        a.db.update("UPDATE fuel_deliveries SET status='RECEIVED',received_by=?,received_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE delivery_id=? AND dgt_id=?",a.user(),deliveryId,store);
        // Neither product prices nor manual fuel selling prices are touched by receiving.
        recordAudit(store,"GAS_DELIVERY_RECEIVED",deliveryId,saved,detail(store,deliveryId));
    }
}
