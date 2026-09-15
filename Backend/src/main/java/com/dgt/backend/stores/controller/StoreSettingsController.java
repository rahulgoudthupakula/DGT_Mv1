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
import com.dgt.backend.stores.service.StoreContactInfoService;
import com.dgt.backend.stores.entity.StoreContactInfo;

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
    private StoreContactInfo contact(String id) {
        var ids=db.queryForList("SELECT contact_info_id FROM store_contact_info WHERE dgt_id=? ORDER BY contact_info_id LIMIT 2",Long.class,id);
        if(ids.size()>1) throw new ResponseStatusException(HttpStatus.CONFLICT,"Multiple contact records exist for this store; resolve duplicates before editing");
        return ids.isEmpty()?null:contacts.get(ids.getFirst());
    }
    @GetMapping
    @PreAuthorize("@scopedAccess.can(authentication,#dgtId,'STORE_SETTINGS',false)")
    public Map<String,Object> get(@PathVariable String dgtId) {
        var result=new LinkedHashMap<String,Object>();
        result.put("store",stores.get(dgtId)); result.put("contact",contact(dgtId)); result.put("hours",hours.get(dgtId)); return result;
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
        db.queryForList("SELECT dgt_id FROM stores WHERE dgt_id=? FOR UPDATE",dgtId);
        var existing=contact(dgtId);
        if(body.contact()!=null) {
            if(!Set.of("address","phone_number","email").containsAll(body.contact().keySet())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unsupported contact field");
            if(!Objects.equals(existing==null?null:existing.rowVersion(),body.contactVersion())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Contact information changed; reload before editing");
            var values=new LinkedHashMap<>(body.contact());
            if(!(values.get("address") instanceof String address) || address.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Address is required for contact information");
            if(existing==null) { values.put("dgt_id",dgtId); contacts.create(values); }
            else contacts.update(existing.contactInfoId(),values,body.contactVersion());
        }
        if(body.hours()!=null) hours.save(dgtId,body.hours(),body.hoursVersions());
        stores.update(dgtId,body.store()==null?Map.of():body.store(),version);
        return get(dgtId);
    }
}
