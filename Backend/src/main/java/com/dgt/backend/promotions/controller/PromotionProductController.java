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

@RestController
@RequestMapping("/api/v1/promotion-products")
public class PromotionProductController {
    private final PromotionProductService service;
    public PromotionProductController(PromotionProductService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'promotion_products', 'READ')")
    public PageResponse<PromotionProductResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'promotion_products', 'READ')")
    public PromotionProductResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'promotion_products', 'WRITE')")
    public PromotionProductResponse create(@Valid @RequestBody CreatePromotionProductRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'promotion_products', 'WRITE')")
    public PromotionProductResponse update(@PathVariable Long id, @RequestBody UpdatePromotionProductRequest request) { return service.update(id, request); }
}
