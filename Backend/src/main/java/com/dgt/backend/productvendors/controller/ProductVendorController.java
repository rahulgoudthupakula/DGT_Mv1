package com.dgt.backend.productvendors.controller;

import com.dgt.backend.productvendors.dto.ProductVendorResponse;
import com.dgt.backend.productvendors.dto.CreateProductVendorRequest;
import com.dgt.backend.productvendors.dto.UpdateProductVendorRequest;
import com.dgt.backend.productvendors.service.ProductVendorService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/product-vendors")
// Generic product vendor link API guarded by AccessPolicy; this is separate from the store-scoped pricebook endpoints.
public class ProductVendorController {
    private final ProductVendorService service;
    public ProductVendorController(ProductVendorService service) { this.service = service; }

    // Read a zero-based page; defaults are page 0 and 50 records.
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'product_vendors', 'READ')")
    public PageResponse<ProductVendorResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    // Read one record by its database identifier.
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'product_vendors', 'READ')")
    public ProductVendorResponse get(@PathVariable Long id) { return service.get(id); }

    // Validate the create DTO and return HTTP 201 after the service saves it.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'product_vendors', 'WRITE')")
    public ProductVendorResponse create(@Valid @RequestBody CreateProductVendorRequest request) { return service.create(request); }

    // Apply non-null request fields; this endpoint does not declare @Valid on its update body.
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'product_vendors', 'WRITE')")
    public ProductVendorResponse update(@PathVariable Long id, @RequestBody UpdateProductVendorRequest request) { return service.update(id, request); }
}
