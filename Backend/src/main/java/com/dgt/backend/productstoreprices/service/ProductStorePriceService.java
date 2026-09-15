package com.dgt.backend.productstoreprices.service;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.dgt.backend.common.service.WriteValidator;
import com.dgt.backend.productstoreprices.repository.ProductStorePriceRepository;
import com.dgt.backend.productstoreprices.entity.ProductStorePrice;
import static com.dgt.backend.productstoreprices.database.ProductStorePriceDatabase.TABLE;
@Service
public class ProductStorePriceService {
    private final ProductStorePriceRepository repository;
    private final WriteValidator validator;
    public ProductStorePriceService(ProductStorePriceRepository repository,WriteValidator validator) { this.repository=repository; this.validator=validator; }
    public Map<String,Object> list(int page,int size) { return repository.list(page,size); }
    public ProductStorePrice get(Long id) { return repository.findById(id); }
    @Transactional
    public Map<String,Object> create(Map<String,Object> values) { return repository.create(validator.validate(TABLE,values,true)); }
    @Transactional
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { var validated=validator.validate(TABLE,values,false); validator.validateUpdate(TABLE,id,validated); return repository.update(id,validated,expected); }
}
