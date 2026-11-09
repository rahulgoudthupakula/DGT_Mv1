package com.dgt.backend.productbarcodes.controller;

import com.dgt.backend.productbarcodes.dto.ProductBarcodeResponse;
import com.dgt.backend.productbarcodes.dto.CreateProductBarcodeRequest;
import com.dgt.backend.productbarcodes.dto.UpdateProductBarcodeRequest;
import com.dgt.backend.productbarcodes.service.ProductBarcodeService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/product-barcodes")
// Generic product barcode API guarded by AccessPolicy; this is separate from the store-scoped pricebook endpoints.
public class ProductBarcodeController {
    private final ProductBarcodeService service;
    public ProductBarcodeController(ProductBarcodeService service) { this.service = service; }

    // Read a zero-based page; defaults are page 0 and 50 records.
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'product_barcodes', 'READ')")
    public PageResponse<ProductBarcodeResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    // Read one record by its database identifier.
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'product_barcodes', 'READ')")
    public ProductBarcodeResponse get(@PathVariable Long id) { return service.get(id); }

    // Validate the create DTO and return HTTP 201 after the service saves it.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'product_barcodes', 'WRITE')")
    public ProductBarcodeResponse create(@Valid @RequestBody CreateProductBarcodeRequest request) { return service.create(request); }

    // Apply non-null request fields; this endpoint does not declare @Valid on its update body.
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'product_barcodes', 'WRITE')")
    public ProductBarcodeResponse update(@PathVariable Long id, @RequestBody UpdateProductBarcodeRequest request) { return service.update(id, request); }
}
