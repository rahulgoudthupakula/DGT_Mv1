package com.dgt.backend.sales.service;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.dgt.backend.common.service.WriteValidator;
import com.dgt.backend.sales.repository.PosTerminalRepository;
import com.dgt.backend.sales.entity.PosTerminal;
import static com.dgt.backend.sales.database.PosTerminalDatabase.TABLE;
@Service
public class PosTerminalService {
    private final PosTerminalRepository repository;
    private final WriteValidator validator;
    public PosTerminalService(PosTerminalRepository repository,WriteValidator validator) { this.repository=repository; this.validator=validator; }
    public Map<String,Object> list(int page,int size) { return repository.list(page,size); }
    public PosTerminal get(Long id) { return repository.findById(id); }
    @Transactional
    public Map<String,Object> create(Map<String,Object> values) { return repository.create(validator.validate(TABLE,values,true)); }
    @Transactional
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { var validated=validator.validate(TABLE,values,false); validator.validateUpdate(TABLE,id,validated); return repository.update(id,validated,expected); }
}
