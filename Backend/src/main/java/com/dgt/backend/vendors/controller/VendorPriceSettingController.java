package com.dgt.backend.vendors.controller;

import com.dgt.backend.vendors.dto.VendorPriceSettingResponse;
import com.dgt.backend.vendors.dto.CreateVendorPriceSettingRequest;
import com.dgt.backend.vendors.dto.UpdateVendorPriceSettingRequest;
import com.dgt.backend.vendors.service.VendorPriceSettingService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/vendor-price-settings")
// Generic vendor pricing preferences API guarded by AccessPolicy; this is separate from the store-scoped pricebook endpoints.
public class VendorPriceSettingController {
    private final VendorPriceSettingService service;
    public VendorPriceSettingController(VendorPriceSettingService service) { this.service = service; }

    // Read a zero-based page; defaults are page 0 and 50 records.
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_price_settings', 'READ')")
    public PageResponse<VendorPriceSettingResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    // Read one record by its database identifier.
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_price_settings', 'READ')")
    public VendorPriceSettingResponse get(@PathVariable Long id) { return service.get(id); }

    // Validate the create DTO and return HTTP 201 after the service saves it.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_price_settings', 'WRITE')")
    public VendorPriceSettingResponse create(@Valid @RequestBody CreateVendorPriceSettingRequest request) { return service.create(request); }

    // Apply non-null request fields; this endpoint does not declare @Valid on its update body.
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_price_settings', 'WRITE')")
    public VendorPriceSettingResponse update(@PathVariable Long id, @RequestBody UpdateVendorPriceSettingRequest request) { return service.update(id, request); }
}
