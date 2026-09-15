package com.dgt.backend.products.service;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.dgt.backend.common.service.WriteValidator;
import com.dgt.backend.products.repository.NewArrivalRepository;
import com.dgt.backend.products.entity.NewArrival;
import static com.dgt.backend.products.database.NewArrivalDatabase.TABLE;
@Service
public class NewArrivalService {
    private final NewArrivalRepository repository;
    private final WriteValidator validator;
    public NewArrivalService(NewArrivalRepository repository,WriteValidator validator) { this.repository=repository; this.validator=validator; }
    public Map<String,Object> list(int page,int size) { return repository.list(page,size); }
    public NewArrival get(Long id) { return repository.findById(id); }
    @Transactional
    public Map<String,Object> create(Map<String,Object> values) { return repository.create(validator.validate(TABLE,values,true)); }
    @Transactional
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { var validated=validator.validate(TABLE,values,false); validator.validateUpdate(TABLE,id,validated); return repository.update(id,validated,expected); }
}
