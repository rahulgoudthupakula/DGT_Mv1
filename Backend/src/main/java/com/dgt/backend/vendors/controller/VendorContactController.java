package com.dgt.backend.vendors.controller;

import com.dgt.backend.vendors.dto.VendorContactResponse;
import com.dgt.backend.vendors.dto.CreateVendorContactRequest;
import com.dgt.backend.vendors.dto.UpdateVendorContactRequest;
import com.dgt.backend.vendors.service.VendorContactService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/vendor-contacts")
public class VendorContactController {
    private final VendorContactService service;
    public VendorContactController(VendorContactService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_contacts', 'READ')")
    public PageResponse<VendorContactResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_contacts', 'READ')")
    public VendorContactResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_contacts', 'WRITE')")
    public VendorContactResponse create(@Valid @RequestBody CreateVendorContactRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_contacts', 'WRITE')")
    public VendorContactResponse update(@PathVariable Long id, @RequestBody UpdateVendorContactRequest request) { return service.update(id, request); }
}
