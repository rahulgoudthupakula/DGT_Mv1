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

/**
 * Generic FuelInvoiceItem record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/fuel-invoice-items")
public class FuelInvoiceItemController {
    private final FuelInvoiceItemService service;
    public FuelInvoiceItemController(FuelInvoiceItemService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_invoice_items', 'READ')")
    public PageResponse<FuelInvoiceItemResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_invoice_items', 'READ')")
    public FuelInvoiceItemResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_invoice_items', 'WRITE')")
    public FuelInvoiceItemResponse create(@Valid @RequestBody CreateFuelInvoiceItemRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_invoice_items', 'WRITE')")
    public FuelInvoiceItemResponse update(@PathVariable Long id, @RequestBody UpdateFuelInvoiceItemRequest request) { return service.update(id, request); }
}
