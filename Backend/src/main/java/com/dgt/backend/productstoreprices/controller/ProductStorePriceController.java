package com.dgt.backend.productstoreprices.controller;

import com.dgt.backend.productstoreprices.dto.ProductStorePriceResponse;
import com.dgt.backend.productstoreprices.dto.CreateProductStorePriceRequest;
import com.dgt.backend.productstoreprices.dto.UpdateProductStorePriceRequest;
import com.dgt.backend.productstoreprices.service.ProductStorePriceService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/product-store-prices")
public class ProductStorePriceController {
    private final ProductStorePriceService service;
    public ProductStorePriceController(ProductStorePriceService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'product_store_prices', 'READ')")
    public PageResponse<ProductStorePriceResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'product_store_prices', 'READ')")
    public ProductStorePriceResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'product_store_prices', 'WRITE')")
    public ProductStorePriceResponse create(@Valid @RequestBody CreateProductStorePriceRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'product_store_prices', 'WRITE')")
    public ProductStorePriceResponse update(@PathVariable Long id, @RequestBody UpdateProductStorePriceRequest request) { return service.update(id, request); }
}
