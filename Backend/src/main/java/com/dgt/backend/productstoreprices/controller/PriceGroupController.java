package com.dgt.backend.productstoreprices.controller;

import com.dgt.backend.productstoreprices.dto.PriceGroupResponse;
import com.dgt.backend.productstoreprices.dto.CreatePriceGroupRequest;
import com.dgt.backend.productstoreprices.dto.UpdatePriceGroupRequest;
import com.dgt.backend.productstoreprices.service.PriceGroupService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/price-groups")
// Generic price group API guarded by AccessPolicy; this is separate from the store-scoped pricebook endpoints.
public class PriceGroupController {
    private final PriceGroupService service;
    public PriceGroupController(PriceGroupService service) { this.service = service; }

    // Read a zero-based page; defaults are page 0 and 50 records.
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'price_groups', 'READ')")
    public PageResponse<PriceGroupResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    // Read one record by its database identifier.
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'price_groups', 'READ')")
    public PriceGroupResponse get(@PathVariable Long id) { return service.get(id); }

    // Validate the create DTO and return HTTP 201 after the service saves it.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'price_groups', 'WRITE')")
    public PriceGroupResponse create(@Valid @RequestBody CreatePriceGroupRequest request) { return service.create(request); }

    // Apply non-null request fields; this endpoint does not declare @Valid on its update body.
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'price_groups', 'WRITE')")
    public PriceGroupResponse update(@PathVariable Long id, @RequestBody UpdatePriceGroupRequest request) { return service.update(id, request); }
}
