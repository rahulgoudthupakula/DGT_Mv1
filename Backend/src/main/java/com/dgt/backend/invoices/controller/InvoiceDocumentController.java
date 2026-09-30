package com.dgt.backend.invoices.controller;

import com.dgt.backend.invoices.dto.InvoiceDocumentResponse;
import com.dgt.backend.invoices.dto.CreateInvoiceDocumentRequest;
import com.dgt.backend.invoices.dto.UpdateInvoiceDocumentRequest;
import com.dgt.backend.invoices.service.InvoiceDocumentService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/invoice-documents")
public class InvoiceDocumentController {
    private final InvoiceDocumentService service;
    public InvoiceDocumentController(InvoiceDocumentService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_documents', 'READ')")
    public PageResponse<InvoiceDocumentResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_documents', 'READ')")
    public InvoiceDocumentResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_documents', 'WRITE')")
    public InvoiceDocumentResponse create(@Valid @RequestBody CreateInvoiceDocumentRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_documents', 'WRITE')")
    public InvoiceDocumentResponse update(@PathVariable Long id, @RequestBody UpdateInvoiceDocumentRequest request) { return service.update(id, request); }
}
