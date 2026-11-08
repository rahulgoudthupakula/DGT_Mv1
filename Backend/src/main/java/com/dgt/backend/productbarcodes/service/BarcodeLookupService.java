package com.dgt.backend.productbarcodes.service;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.dgt.backend.productbarcodes.repository.BarcodeLookupRepository;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
// Coordinate barcode lookup persistence and response mapping; caller authorization is handled at the controller.
public class BarcodeLookupService {
    private final BarcodeLookupRepository repository;
    public BarcodeLookupService(BarcodeLookupRepository repository) { this.repository=repository; }
    // Return the first matching row, or HTTP 404 when no active barcode product is found.
    public Map<String,Object> lookup(String dgtId,String barcode) {
        log.debug("Barcode lookup dgtId={} barcode={}", dgtId, barcode);
        var rows=repository.lookup(dgtId,barcode);
        if(rows.isEmpty()) {
            log.warn("Barcode not found dgtId={} barcode={}", dgtId, barcode);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Active barcode product not found");
        }
        // Multiple results are not checked for ambiguity here; repository ordering is unspecified.
        return rows.getFirst();
    }
}
