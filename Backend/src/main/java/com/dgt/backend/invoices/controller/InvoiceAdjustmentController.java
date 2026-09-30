package com.dgt.backend.invoices.controller;

import com.dgt.backend.invoices.dto.InvoiceAdjustmentResponse;
import com.dgt.backend.invoices.dto.CreateInvoiceAdjustmentRequest;
import com.dgt.backend.invoices.dto.UpdateInvoiceAdjustmentRequest;
import com.dgt.backend.invoices.service.InvoiceAdjustmentService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/invoice-adjustments")
public class InvoiceAdjustmentController {
    private final InvoiceAdjustmentService service;
    public InvoiceAdjustmentController(InvoiceAdjustmentService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_adjustments', 'READ')")
    public PageResponse<InvoiceAdjustmentResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_adjustments', 'READ')")
    public InvoiceAdjustmentResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_adjustments', 'WRITE')")
    public InvoiceAdjustmentResponse create(@Valid @RequestBody CreateInvoiceAdjustmentRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_adjustments', 'WRITE')")
    public InvoiceAdjustmentResponse update(@PathVariable Long id, @RequestBody UpdateInvoiceAdjustmentRequest request) { return service.update(id, request); }
}
