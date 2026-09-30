package com.dgt.backend.fuel.controller;

import com.dgt.backend.fuel.dto.FuelInvoiceDetailResponse;
import com.dgt.backend.fuel.dto.CreateFuelInvoiceDetailRequest;
import com.dgt.backend.fuel.dto.UpdateFuelInvoiceDetailRequest;
import com.dgt.backend.fuel.service.FuelInvoiceDetailService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/fuel-invoice-details")
public class FuelInvoiceDetailController {
    private final FuelInvoiceDetailService service;
    public FuelInvoiceDetailController(FuelInvoiceDetailService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_invoice_details', 'READ')")
    public PageResponse<FuelInvoiceDetailResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_invoice_details', 'READ')")
    public FuelInvoiceDetailResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_invoice_details', 'WRITE')")
    public FuelInvoiceDetailResponse create(@Valid @RequestBody CreateFuelInvoiceDetailRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_invoice_details', 'WRITE')")
    public FuelInvoiceDetailResponse update(@PathVariable Long id, @RequestBody UpdateFuelInvoiceDetailRequest request) { return service.update(id, request); }
}
