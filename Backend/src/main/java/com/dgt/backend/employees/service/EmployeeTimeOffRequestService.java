package com.dgt.backend.employees.service;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.dgt.backend.common.service.WriteValidator;
import com.dgt.backend.employees.repository.EmployeeTimeOffRequestRepository;
import com.dgt.backend.employees.entity.EmployeeTimeOffRequest;
import static com.dgt.backend.employees.database.EmployeeTimeOffRequestDatabase.TABLE;
@Service
public class EmployeeTimeOffRequestService {
    private final EmployeeTimeOffRequestRepository repository;
    private final WriteValidator validator;
    public EmployeeTimeOffRequestService(EmployeeTimeOffRequestRepository repository,WriteValidator validator) { this.repository=repository; this.validator=validator; }
    public Map<String,Object> list(int page,int size) { return repository.list(page,size); }
    public EmployeeTimeOffRequest get(Long id) { return repository.findById(id); }
    @Transactional
    public Map<String,Object> create(Map<String,Object> values) { return repository.create(validator.validate(TABLE,values,true)); }
    @Transactional
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { var validated=validator.validate(TABLE,values,false); validator.validateUpdate(TABLE,id,validated); return repository.update(id,validated,expected); }
}
