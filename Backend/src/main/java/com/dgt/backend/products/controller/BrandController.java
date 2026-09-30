package com.dgt.backend.products.controller;

import com.dgt.backend.products.dto.BrandResponse;
import com.dgt.backend.products.dto.CreateBrandRequest;
import com.dgt.backend.products.dto.UpdateBrandRequest;
import com.dgt.backend.products.service.BrandService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/brands")
public class BrandController {
    private final BrandService service;
    public BrandController(BrandService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'brands', 'READ')")
    public PageResponse<BrandResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'brands', 'READ')")
    public BrandResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'brands', 'WRITE')")
    public BrandResponse create(@Valid @RequestBody CreateBrandRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'brands', 'WRITE')")
    public BrandResponse update(@PathVariable Long id, @RequestBody UpdateBrandRequest request) { return service.update(id, request); }
}
