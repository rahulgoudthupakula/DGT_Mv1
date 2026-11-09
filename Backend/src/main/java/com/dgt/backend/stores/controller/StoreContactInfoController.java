package com.dgt.backend.stores.controller;

import com.dgt.backend.stores.dto.StoreContactInfoResponse;
import com.dgt.backend.stores.dto.CreateStoreContactInfoRequest;
import com.dgt.backend.stores.dto.UpdateStoreContactInfoRequest;
import com.dgt.backend.stores.service.StoreContactInfoService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/store-contact-info")
// Generic store contact information API guarded by AccessPolicy; this is separate from the store-scoped pricebook endpoints.
public class StoreContactInfoController {
    private final StoreContactInfoService service;
    public StoreContactInfoController(StoreContactInfoService service) { this.service = service; }

    // Read a zero-based page; defaults are page 0 and 50 records.
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'store_contact_info', 'READ')")
    public PageResponse<StoreContactInfoResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    // Read one record by its database identifier.
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_contact_info', 'READ')")
    public StoreContactInfoResponse get(@PathVariable Long id) { return service.get(id); }

    // Validate the create DTO and return HTTP 201 after the service saves it.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'store_contact_info', 'WRITE')")
    public StoreContactInfoResponse create(@Valid @RequestBody CreateStoreContactInfoRequest request) { return service.create(request); }

    // Apply non-null request fields; this endpoint does not declare @Valid on its update body.
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_contact_info', 'WRITE')")
    public StoreContactInfoResponse update(@PathVariable Long id, @RequestBody UpdateStoreContactInfoRequest request) { return service.update(id, request); }
}
