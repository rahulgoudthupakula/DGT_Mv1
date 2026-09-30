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
public class SalePaymentController {
    private final SalePaymentService service;
    public SalePaymentController(SalePaymentService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'sale_payments', 'READ')")
    public PageResponse<SalePaymentResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'sale_payments', 'READ')")
    public SalePaymentResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'sale_payments', 'WRITE')")
    public SalePaymentResponse create(@Valid @RequestBody CreateSalePaymentRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'sale_payments', 'WRITE')")
    public SalePaymentResponse update(@PathVariable Long id, @RequestBody UpdateSalePaymentRequest request) { return service.update(id, request); }
}
