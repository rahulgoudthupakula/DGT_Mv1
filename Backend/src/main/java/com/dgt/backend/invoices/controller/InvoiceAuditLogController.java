package com.dgt.backend.invoices.controller;

import com.dgt.backend.invoices.dto.InvoiceAuditLogResponse;
import com.dgt.backend.invoices.dto.CreateInvoiceAuditLogRequest;
import com.dgt.backend.invoices.dto.UpdateInvoiceAuditLogRequest;
import com.dgt.backend.invoices.service.InvoiceAuditLogService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/invoice-audit-logs")
public class InvoiceAuditLogController {
    private final InvoiceAuditLogService service;
    public InvoiceAuditLogController(InvoiceAuditLogService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_audit_logs', 'READ')")
    public PageResponse<InvoiceAuditLogResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_audit_logs', 'READ')")
    public InvoiceAuditLogResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_audit_logs', 'WRITE')")
    public InvoiceAuditLogResponse create(@Valid @RequestBody CreateInvoiceAuditLogRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'invoice_audit_logs', 'WRITE')")
    public InvoiceAuditLogResponse update(@PathVariable Long id, @RequestBody UpdateInvoiceAuditLogRequest request) { return service.update(id, request); }
}
