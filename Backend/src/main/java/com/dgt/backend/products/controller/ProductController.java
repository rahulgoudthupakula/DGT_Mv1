package com.dgt.backend.products.controller;

import com.dgt.backend.products.dto.ProductResponse;
import com.dgt.backend.products.dto.CreateProductRequest;
import com.dgt.backend.products.dto.UpdateProductRequest;
import com.dgt.backend.products.service.ProductService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    private final ProductService service;
    public ProductController(ProductService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'products', 'READ')")
    public PageResponse<ProductResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'products', 'READ')")
    public ProductResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'products', 'WRITE')")
    public ProductResponse create(@Valid @RequestBody CreateProductRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'products', 'WRITE')")
    public ProductResponse update(@PathVariable Long id, @RequestBody UpdateProductRequest request) { return service.update(id, request); }
}
