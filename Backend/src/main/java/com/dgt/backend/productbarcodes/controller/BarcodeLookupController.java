package com.dgt.backend.productbarcodes.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.productbarcodes.service.BarcodeLookupService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/barcode-lookup")
public class BarcodeLookupController {
    private final BarcodeLookupService service;
    public BarcodeLookupController(BarcodeLookupService service) { this.service=service; }
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'product_barcodes', 'READ')")
    public Map<String,Object> lookup(@RequestParam String storeId,@RequestParam String barcode) { return service.lookup(storeId,barcode); }
}
