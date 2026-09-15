package com.dgt.backend.productbarcodes.service;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.dgt.backend.productbarcodes.repository.BarcodeLookupRepository;

@Service
public class BarcodeLookupService {
    private final BarcodeLookupRepository repository;
    public BarcodeLookupService(BarcodeLookupRepository repository) { this.repository=repository; }
    public Map<String,Object> lookup(String dgtId,String barcode) {
        var rows=repository.lookup(dgtId,barcode);
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Active barcode product not found");
        return rows.getFirst();
    }
}
