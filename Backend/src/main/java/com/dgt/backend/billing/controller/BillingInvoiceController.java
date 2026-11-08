package com.dgt.backend.billing.controller;

import com.dgt.backend.billing.dto.BillingInvoiceResponse;
import com.dgt.backend.billing.dto.CreateBillingInvoiceRequest;
import com.dgt.backend.billing.dto.UpdateBillingInvoiceRequest;
import com.dgt.backend.billing.service.BillingInvoiceService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * Generic BillingInvoice record API, gated by AccessPolicy.
 * Delegates CRUD operations to the service; subscription lifecycle commands use StoreBillingController.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/billing-invoices")
public class BillingInvoiceController {
    private final BillingInvoiceService service;
    public BillingInvoiceController(BillingInvoiceService service) { this.service = service; }

    /** Return a zero-based page of records after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'billing_invoices', 'READ')")
    public PageResponse<BillingInvoiceResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return service.list(page, size);
    }

    /** Fetch one record by its database identifier; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'billing_invoices', 'READ')")
    public BillingInvoiceResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the create request and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'billing_invoices', 'WRITE')")
    public BillingInvoiceResponse create(@Valid @RequestBody CreateBillingInvoiceRequest request) { return service.create(request); }

    /** Apply supplied non-null fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'billing_invoices', 'WRITE')")
    public BillingInvoiceResponse update(@PathVariable Long id, @RequestBody UpdateBillingInvoiceRequest request) { return service.update(id, request); }
}
