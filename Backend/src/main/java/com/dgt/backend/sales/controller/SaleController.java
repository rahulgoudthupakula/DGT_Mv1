package com.dgt.backend.sales.controller;

import com.dgt.backend.sales.dto.SaleResponse;
import com.dgt.backend.sales.dto.CreateSaleRequest;
import com.dgt.backend.sales.dto.UpdateSaleRequest;
import com.dgt.backend.sales.service.SaleService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/sales")
public class SaleController {
    private final SaleService service;
    public SaleController(SaleService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'sales', 'READ')")
    public PageResponse<SaleResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'sales', 'READ')")
    public SaleResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'sales', 'WRITE')")
    public SaleResponse create(@Valid @RequestBody CreateSaleRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'sales', 'WRITE')")
    public SaleResponse update(@PathVariable Long id, @RequestBody UpdateSaleRequest request) { return service.update(id, request); }
}
