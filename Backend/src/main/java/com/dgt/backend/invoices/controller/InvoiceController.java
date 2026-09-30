package com.dgt.backend.invoices.controller;

import com.dgt.backend.invoices.dto.InvoiceResponse;
import com.dgt.backend.invoices.dto.CreateInvoiceRequest;
import com.dgt.backend.invoices.dto.UpdateInvoiceRequest;
import com.dgt.backend.invoices.service.InvoiceService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {
    private final InvoiceService service;
    public InvoiceController(InvoiceService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'invoices', 'READ')")
    public PageResponse<InvoiceResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'invoices', 'READ')")
    public InvoiceResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'invoices', 'WRITE')")
    public InvoiceResponse create(@Valid @RequestBody CreateInvoiceRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'invoices', 'WRITE')")
    public InvoiceResponse update(@PathVariable Long id, @RequestBody UpdateInvoiceRequest request) { return service.update(id, request); }
}
