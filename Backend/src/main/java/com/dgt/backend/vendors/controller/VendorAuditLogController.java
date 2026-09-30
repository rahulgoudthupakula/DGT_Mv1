package com.dgt.backend.vendors.controller;

import com.dgt.backend.vendors.dto.VendorAuditLogResponse;
import com.dgt.backend.vendors.dto.CreateVendorAuditLogRequest;
import com.dgt.backend.vendors.dto.UpdateVendorAuditLogRequest;
import com.dgt.backend.vendors.service.VendorAuditLogService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/vendor-audit-logs")
public class VendorAuditLogController {
    private final VendorAuditLogService service;
    public VendorAuditLogController(VendorAuditLogService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_audit_log', 'READ')")
    public PageResponse<VendorAuditLogResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_audit_log', 'READ')")
    public VendorAuditLogResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_audit_log', 'WRITE')")
    public VendorAuditLogResponse create(@Valid @RequestBody CreateVendorAuditLogRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_audit_log', 'WRITE')")
    public VendorAuditLogResponse update(@PathVariable Long id, @RequestBody UpdateVendorAuditLogRequest request) { return service.update(id, request); }
}
