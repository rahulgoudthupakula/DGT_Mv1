package com.dgt.backend.vendors.controller;

import com.dgt.backend.vendors.dto.VendorItemCostHistoryResponse;
import com.dgt.backend.vendors.dto.CreateVendorItemCostHistoryRequest;
import com.dgt.backend.vendors.dto.UpdateVendorItemCostHistoryRequest;
import com.dgt.backend.vendors.service.VendorItemCostHistoryService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/vendor-item-cost-histories")
// Generic vendor cost history API guarded by AccessPolicy; this is separate from the store-scoped pricebook endpoints.
public class VendorItemCostHistoryController {
    private final VendorItemCostHistoryService service;
    public VendorItemCostHistoryController(VendorItemCostHistoryService service) { this.service = service; }

    // Read a zero-based page; defaults are page 0 and 50 records.
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_item_cost_history', 'READ')")
    public PageResponse<VendorItemCostHistoryResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    // Read one record by its database identifier.
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_item_cost_history', 'READ')")
    public VendorItemCostHistoryResponse get(@PathVariable Long id) { return service.get(id); }

    // Validate the create DTO and return HTTP 201 after the service saves it.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_item_cost_history', 'WRITE')")
    public VendorItemCostHistoryResponse create(@Valid @RequestBody CreateVendorItemCostHistoryRequest request) { return service.create(request); }

    // Apply non-null request fields; this endpoint does not declare @Valid on its update body.
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_item_cost_history', 'WRITE')")
    public VendorItemCostHistoryResponse update(@PathVariable Long id, @RequestBody UpdateVendorItemCostHistoryRequest request) { return service.update(id, request); }
}
