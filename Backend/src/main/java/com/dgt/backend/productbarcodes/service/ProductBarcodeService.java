package com.dgt.backend.productbarcodes.service;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.dgt.backend.common.service.WriteValidator;
import com.dgt.backend.productbarcodes.repository.ProductBarcodeRepository;
import com.dgt.backend.productbarcodes.entity.ProductBarcode;
import static com.dgt.backend.productbarcodes.database.ProductBarcodeDatabase.TABLE;
@Service
public class ProductBarcodeService {
    private final ProductBarcodeRepository repository;
    private final WriteValidator validator;
    public ProductBarcodeService(ProductBarcodeRepository repository,WriteValidator validator) { this.repository=repository; this.validator=validator; }
    public Map<String,Object> list(int page,int size) { return repository.list(page,size); }
    public ProductBarcode get(Long id) { return repository.findById(id); }
    @Transactional
    public Map<String,Object> create(Map<String,Object> values) { return repository.create(validator.validate(TABLE,values,true)); }
    @Transactional
    public Map<String,Object> update(Long id,Map<String,Object> values,String expected) { var validated=validator.validate(TABLE,values,false); validator.validateUpdate(TABLE,id,validated); return repository.update(id,validated,expected); }
}
