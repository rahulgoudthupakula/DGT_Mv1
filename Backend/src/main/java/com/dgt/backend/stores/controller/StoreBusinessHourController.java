package com.dgt.backend.stores.controller;

import com.dgt.backend.stores.dto.StoreBusinessHourResponse;
import com.dgt.backend.stores.dto.CreateStoreBusinessHourRequest;
import com.dgt.backend.stores.dto.UpdateStoreBusinessHourRequest;
import com.dgt.backend.stores.service.StoreBusinessHourService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/store-business-hours")
// Generic store business hours API guarded by AccessPolicy; this is separate from the store-scoped pricebook endpoints.
public class StoreBusinessHourController {
    private final StoreBusinessHourService service;
    public StoreBusinessHourController(StoreBusinessHourService service) { this.service = service; }

    // Read a zero-based page; defaults are page 0 and 50 records.
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'store_business_hours', 'READ')")
    public PageResponse<StoreBusinessHourResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    // Read one record by its database identifier.
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_business_hours', 'READ')")
    public StoreBusinessHourResponse get(@PathVariable Long id) { return service.get(id); }

    // Validate the create DTO and return HTTP 201 after the service saves it.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'store_business_hours', 'WRITE')")
    public StoreBusinessHourResponse create(@Valid @RequestBody CreateStoreBusinessHourRequest request) { return service.create(request); }

    // Apply non-null request fields; this endpoint does not declare @Valid on its update body.
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_business_hours', 'WRITE')")
    public StoreBusinessHourResponse update(@PathVariable Long id, @RequestBody UpdateStoreBusinessHourRequest request) { return service.update(id, request); }
}
