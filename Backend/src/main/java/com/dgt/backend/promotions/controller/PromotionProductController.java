package com.dgt.backend.promotions.controller;

import com.dgt.backend.promotions.dto.PromotionProductResponse;
import com.dgt.backend.promotions.dto.CreatePromotionProductRequest;
import com.dgt.backend.promotions.dto.UpdatePromotionProductRequest;
import com.dgt.backend.promotions.service.PromotionProductService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/promotion-products")
// Generic promotion-product link API guarded by AccessPolicy; this is separate from the store-scoped pricebook endpoints.
public class PromotionProductController {
    private final PromotionProductService service;
    public PromotionProductController(PromotionProductService service) { this.service = service; }

    // Read a zero-based page; defaults are page 0 and 50 records.
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'promotion_products', 'READ')")
    public PageResponse<PromotionProductResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    // Read one record by its database identifier.
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'promotion_products', 'READ')")
    public PromotionProductResponse get(@PathVariable Long id) { return service.get(id); }

    // Validate the create DTO and return HTTP 201 after the service saves it.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'promotion_products', 'WRITE')")
    public PromotionProductResponse create(@Valid @RequestBody CreatePromotionProductRequest request) { return service.create(request); }

    // Apply non-null request fields; this endpoint does not declare @Valid on its update body.
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'promotion_products', 'WRITE')")
    public PromotionProductResponse update(@PathVariable Long id, @RequestBody UpdatePromotionProductRequest request) { return service.update(id, request); }
}
