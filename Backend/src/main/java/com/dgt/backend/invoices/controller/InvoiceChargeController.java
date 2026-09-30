package com.dgt.backend.invoices.controller;

import com.dgt.backend.invoices.dto.InvoiceChargeResponse;
import com.dgt.backend.invoices.dto.CreateInvoiceChargeRequest;
import com.dgt.backend.invoices.dto.UpdateInvoiceChargeRequest;
import com.dgt.backend.invoices.service.InvoiceChargeService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/invoice-charges")
public class InvoiceChargeController {
    private final InvoiceChargeService service;
    public InvoiceChargeController(InvoiceChargeService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_charges', 'READ')")
    public PageResponse<InvoiceChargeResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_charges', 'READ')")
    public InvoiceChargeResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_charges', 'WRITE')")
    public InvoiceChargeResponse create(@Valid @RequestBody CreateInvoiceChargeRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_charges', 'WRITE')")
    public InvoiceChargeResponse update(@PathVariable Long id, @RequestBody UpdateInvoiceChargeRequest request) { return service.update(id, request); }
}
