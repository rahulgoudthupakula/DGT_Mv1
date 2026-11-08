package com.dgt.backend.productstoreprices.controller;

import com.dgt.backend.productstoreprices.dto.ProductPriceGroupResponse;
import com.dgt.backend.productstoreprices.dto.CreateProductPriceGroupRequest;
import com.dgt.backend.productstoreprices.dto.UpdateProductPriceGroupRequest;
import com.dgt.backend.productstoreprices.service.ProductPriceGroupService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/product-price-groups")
// Generic product price-group link API guarded by AccessPolicy; this is separate from the store-scoped pricebook endpoints.
public class ProductPriceGroupController {
    private final ProductPriceGroupService service;
    public ProductPriceGroupController(ProductPriceGroupService service) { this.service = service; }

    // Read a zero-based page; defaults are page 0 and 50 records.
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'product_price_groups', 'READ')")
    public PageResponse<ProductPriceGroupResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    // Read one record by its database identifier.
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'product_price_groups', 'READ')")
    public ProductPriceGroupResponse get(@PathVariable Long id) { return service.get(id); }

    // Validate the create DTO and return HTTP 201 after the service saves it.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'product_price_groups', 'WRITE')")
    public ProductPriceGroupResponse create(@Valid @RequestBody CreateProductPriceGroupRequest request) { return service.create(request); }

    // Apply non-null request fields; this endpoint does not declare @Valid on its update body.
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'product_price_groups', 'WRITE')")
    public ProductPriceGroupResponse update(@PathVariable Long id, @RequestBody UpdateProductPriceGroupRequest request) { return service.update(id, request); }
}
