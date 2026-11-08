package com.dgt.backend.stores.controller;

import java.util.*;
import com.dgt.backend.access.ApprovalService;
import com.dgt.backend.stores.service.StoreHoursService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.dgt.backend.stores.service.StoreService;
import com.dgt.backend.stores.dto.StoreResponse;
import com.dgt.backend.stores.dto.UpdateStoreRequest;
import com.dgt.backend.stores.service.StoreContactInfoService;
import com.dgt.backend.stores.dto.StoreContactInfoResponse;
import com.dgt.backend.stores.dto.CreateStoreContactInfoRequest;
import com.dgt.backend.stores.dto.UpdateStoreContactInfoRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/stores/{dgtId}/settings")
public class StoreSettingsController {
    private final ApprovalService approvals;
    private final StoreHoursService hours;
    private final JdbcTemplate db;
    private final StoreService stores;
    private final StoreContactInfoService contacts;
    public StoreSettingsController(JdbcTemplate db, StoreService stores, StoreContactInfoService contacts, StoreHoursService hours, ApprovalService approvals) {
        this.approvals=approvals;
        this.hours=hours;
        this.db=db; this.stores=stores; this.contacts=contacts;
    }
    private StoreContactInfoResponse contact(String id) {
        var ids=db.queryForList("SELECT contact_info_id FROM store_contact_info WHERE dgt_id=? ORDER BY contact_info_id LIMIT 2",Long.class,id);
        if(ids.size()>1) throw new ResponseStatusException(HttpStatus.CONFLICT,"Multiple contact records exist for this store; resolve duplicates before editing");
        return ids.isEmpty()?null:contacts.get(ids.getFirst());
    }
    @GetMapping
    @PreAuthorize("@scopedAccess.can(authentication,#dgtId,'STORE_SETTINGS',false)")
    public Map<String,Object> get(@PathVariable String dgtId) {
        var result=new LinkedHashMap<String,Object>();
        var sr=stores.get(dgtId);
        var storeMap=new LinkedHashMap<String,Object>();
        storeMap.put("dgt_id",sr.dgtId());storeMap.put("store_id",sr.storeId());storeMap.put("store_name",sr.storeName());
        storeMap.put("legal_business_name",sr.legalBusinessName());storeMap.put("tax_id",sr.taxId());storeMap.put("license_number",sr.licenseNumber());
        storeMap.put("timezone",sr.timezone());storeMap.put("company_id",sr.companyId());storeMap.put("created_at",sr.createdAt());storeMap.put("updated_at",sr.updatedAt());
        var xv=db.queryForList("SELECT xmin::text AS v FROM stores WHERE dgt_id=?",dgtId);
        if(!xv.isEmpty())storeMap.put("_version",xv.getFirst().get("v"));
        result.put("store",storeMap);result.put("contact",contact(dgtId));result.put("hours",hours.get(dgtId));return result;
    }
    public record Update(Map<String,Object> store, Map<String,Object> contact, String contactVersion, List<StoreHoursService.Day> hours, Map<String,String> hoursVersions) {}
    @PatchMapping
    @Transactional
    @PreAuthorize("@scopedAccess.can(authentication,#dgtId,'STORE_SETTINGS',true)")
    public Object update(@PathVariable String dgtId, @RequestHeader("If-Match") String version, @RequestHeader("Idempotency-Key") String key, @RequestBody Update body) {
        return approvals.submit(dgtId,"STORE_SETTINGS",null,version,body,key);
    }
    public Map<String,Object> apply(String dgtId,String version,Update body) {
        if(body.store()!=null && !Set.of("store_id","store_name","legal_business_name","tax_id","license_number","timezone").containsAll(body.store().keySet())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unsupported store field");
        var lock=db.queryForList("SELECT xmin::text AS v FROM stores WHERE dgt_id=? FOR UPDATE",dgtId);
        if(version!=null&&!version.isBlank()&&!lock.isEmpty()&&!version.equals(lock.get(0).get("v")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Store changed since this was submitted; submit again");
        var existing=contact(dgtId);
        if(body.contact()!=null) {
            if(!Set.of("address","phone_number","email").containsAll(body.contact().keySet())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unsupported contact field");
            var values=body.contact();
            if(!(values.get("address") instanceof String address) || address.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Address is required for contact information");
            if(existing==null) {
                contacts.create(new CreateStoreContactInfoRequest(
                        dgtId,
                        (String)values.get("phone_number"),
                        (String)values.get("email"),
                        (String)values.get("address"),
                        null
                ));
            } else {
                contacts.update(existing.contactInfoId(), new UpdateStoreContactInfoRequest(
                        dgtId,
                        values.containsKey("phone_number")?(String)values.get("phone_number"):existing.phoneNumber(),
                        values.containsKey("email")?(String)values.get("email"):existing.email(),
                        values.containsKey("address")?(String)values.get("address"):existing.address(),
                        existing.storeName()
                ));
            }
        }
        if(body.hours()!=null) hours.save(dgtId,body.hours(),body.hoursVersions());
        if(body.store()!=null && !body.store().isEmpty()) {
            if(body.store().containsKey("timezone")){try{java.time.ZoneId.of((String)body.store().get("timezone"));}catch(java.time.DateTimeException e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid timezone: use a valid IANA timezone identifier");}}
            StoreResponse existingStore=stores.get(dgtId);
            var sv=body.store();
            stores.update(dgtId, new UpdateStoreRequest(
                    existingStore.storeId(),
                    sv.containsKey("store_name")?(String)sv.get("store_name"):existingStore.storeName(),
                    sv.containsKey("legal_business_name")?(String)sv.get("legal_business_name"):existingStore.legalBusinessName(),
                    sv.containsKey("tax_id")?(String)sv.get("tax_id"):existingStore.taxId(),
                    sv.containsKey("license_number")?(String)sv.get("license_number"):existingStore.licenseNumber(),
                    sv.containsKey("timezone")?(String)sv.get("timezone"):existingStore.timezone(),
                    existingStore.companyId()
            ));
        }
        return get(dgtId);
    }
}
