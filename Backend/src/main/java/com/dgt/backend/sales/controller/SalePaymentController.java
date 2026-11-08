package com.dgt.backend.sales.controller;

import com.dgt.backend.sales.dto.SalePaymentResponse;
import com.dgt.backend.sales.dto.CreateSalePaymentRequest;
import com.dgt.backend.sales.dto.UpdateSalePaymentRequest;
import com.dgt.backend.sales.service.SalePaymentService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/sale-payments")
// Generic sale payment API guarded by AccessPolicy; this is separate from the store-scoped pricebook endpoints.
public class SalePaymentController {
    private final SalePaymentService service;
    public SalePaymentController(SalePaymentService service) { this.service = service; }

    // Read a zero-based page; defaults are page 0 and 50 records.
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'sale_payments', 'READ')")
    public PageResponse<SalePaymentResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    // Read one record by its database identifier.
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'sale_payments', 'READ')")
    public SalePaymentResponse get(@PathVariable Long id) { return service.get(id); }

    // Validate the create DTO and return HTTP 201 after the service saves it.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'sale_payments', 'WRITE')")
    public SalePaymentResponse create(@Valid @RequestBody CreateSalePaymentRequest request) { return service.create(request); }

    // Apply non-null request fields; this endpoint does not declare @Valid on its update body.
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'sale_payments', 'WRITE')")
    public SalePaymentResponse update(@PathVariable Long id, @RequestBody UpdateSalePaymentRequest request) { return service.update(id, request); }
}
