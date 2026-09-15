package com.dgt.backend.lottery.service;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.dgt.backend.common.service.WriteValidator;
import com.dgt.backend.lottery.repository.LotteryGameRepository;
import com.dgt.backend.lottery.entity.LotteryGame;
import static com.dgt.backend.lottery.database.LotteryGameDatabase.TABLE;
@Service
public class LotteryGameService {
    private final LotteryGameRepository repository;
    private final WriteValidator validator;
    public LotteryGameService(LotteryGameRepository repository,WriteValidator validator) { this.repository=repository; this.validator=validator; }
    public Map<String,Object> list(int page,int size) { return repository.list(page,size); }
    public LotteryGame get(Long id) { return repository.findById(id); }
    @Transactional
    public Map<String,Object> create(Map<String,Object> values) { return repository.create(validator.validate(TABLE,values,true)); }
    @Transactional
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { var validated=validator.validate(TABLE,values,false); validator.validateUpdate(TABLE,id,validated); return repository.update(id,validated,expected); }
}
