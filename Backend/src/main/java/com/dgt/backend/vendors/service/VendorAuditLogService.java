package com.dgt.backend.vendors.service;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.dgt.backend.common.service.WriteValidator;
import com.dgt.backend.vendors.repository.VendorAuditLogRepository;
import com.dgt.backend.vendors.entity.VendorAuditLog;
import static com.dgt.backend.vendors.database.VendorAuditLogDatabase.TABLE;
@Service
public class VendorAuditLogService {
    private final VendorAuditLogRepository repository;
    private final WriteValidator validator;
    public VendorAuditLogService(VendorAuditLogRepository repository,WriteValidator validator) { this.repository=repository; this.validator=validator; }
    public Map<String,Object> list(int page,int size) { return repository.list(page,size); }
    public VendorAuditLog get(Long id) { return repository.findById(id); }
    @Transactional
    public Map<String,Object> create(Map<String,Object> values) { return repository.create(validator.validate(TABLE,values,true)); }
    @Transactional
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { var validated=validator.validate(TABLE,values,false); validator.validateUpdate(TABLE,id,validated); return repository.update(id,validated,expected); }
}
