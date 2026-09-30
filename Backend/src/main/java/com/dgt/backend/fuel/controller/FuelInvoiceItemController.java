package com.dgt.backend.fuel.controller;

import com.dgt.backend.fuel.dto.FuelInvoiceItemResponse;
import com.dgt.backend.fuel.dto.CreateFuelInvoiceItemRequest;
import com.dgt.backend.fuel.dto.UpdateFuelInvoiceItemRequest;
import com.dgt.backend.fuel.service.FuelInvoiceItemService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/fuel-invoice-items")
public class FuelInvoiceItemController {
    private final FuelInvoiceItemService service;
    public FuelInvoiceItemController(FuelInvoiceItemService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_invoice_items', 'READ')")
    public PageResponse<FuelInvoiceItemResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_invoice_items', 'READ')")
    public FuelInvoiceItemResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_invoice_items', 'WRITE')")
    public FuelInvoiceItemResponse create(@Valid @RequestBody CreateFuelInvoiceItemRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_invoice_items', 'WRITE')")
    public FuelInvoiceItemResponse update(@PathVariable Long id, @RequestBody UpdateFuelInvoiceItemRequest request) { return service.update(id, request); }
}
