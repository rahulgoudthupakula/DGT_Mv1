package com.dgt.backend.productbarcodes.service;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.dgt.backend.productbarcodes.repository.BarcodeLookupRepository;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class BarcodeLookupService {
    private final BarcodeLookupRepository repository;
    public BarcodeLookupService(BarcodeLookupRepository repository) { this.repository=repository; }
    public Map<String,Object> lookup(String dgtId,String barcode) {
        log.debug("Barcode lookup dgtId={} barcode={}", dgtId, barcode);
        var rows=repository.lookup(dgtId,barcode);
        if(rows.isEmpty()) {
            log.warn("Barcode not found dgtId={} barcode={}", dgtId, barcode);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Active barcode product not found");
        }
        return rows.getFirst();
    }
}
