package com.dgt.backend.inventory.controller;

import com.dgt.backend.inventory.dto.InventoryReductionRequestResponse;
import com.dgt.backend.inventory.dto.CreateInventoryReductionRequestRequest;
import com.dgt.backend.inventory.dto.UpdateInventoryReductionRequestRequest;
import com.dgt.backend.inventory.service.InventoryReductionRequestService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * Generic InventoryReductionRequest record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory-reduction-requests")
public class InventoryReductionRequestController {
    private final InventoryReductionRequestService service;
    public InventoryReductionRequestController(InventoryReductionRequestService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_reduction_requests', 'READ')")
    public PageResponse<InventoryReductionRequestResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_reduction_requests', 'READ')")
    public InventoryReductionRequestResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_reduction_requests', 'WRITE')")
    public InventoryReductionRequestResponse create(@Valid @RequestBody CreateInventoryReductionRequestRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_reduction_requests', 'WRITE')")
    public InventoryReductionRequestResponse update(@PathVariable Long id, @RequestBody UpdateInventoryReductionRequestRequest request) { return service.update(id, request); }
}
