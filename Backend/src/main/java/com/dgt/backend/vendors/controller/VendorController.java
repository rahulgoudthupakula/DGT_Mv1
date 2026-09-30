package com.dgt.backend.vendors.controller;

import com.dgt.backend.vendors.dto.VendorResponse;
import com.dgt.backend.vendors.dto.CreateVendorRequest;
import com.dgt.backend.vendors.dto.UpdateVendorRequest;
import com.dgt.backend.vendors.service.VendorService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/vendors")
public class VendorController {
    private final VendorService service;
    public VendorController(VendorService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'vendors', 'READ')")
    public PageResponse<VendorResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'vendors', 'READ')")
    public VendorResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'vendors', 'WRITE')")
    public VendorResponse create(@Valid @RequestBody CreateVendorRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'vendors', 'WRITE')")
    public VendorResponse update(@PathVariable Long id, @RequestBody UpdateVendorRequest request) { return service.update(id, request); }
}
