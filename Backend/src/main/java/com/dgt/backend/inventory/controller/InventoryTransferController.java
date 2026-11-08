package com.dgt.backend.inventory.controller;

import com.dgt.backend.inventory.dto.InventoryTransferResponse;
import com.dgt.backend.inventory.dto.CreateInventoryTransferRequest;
import com.dgt.backend.inventory.dto.UpdateInventoryTransferRequest;
import com.dgt.backend.inventory.service.InventoryTransferService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * Generic InventoryTransfer record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory-transfers")
public class InventoryTransferController {
    private final InventoryTransferService service;
    public InventoryTransferController(InventoryTransferService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_transfers', 'READ')")
    public PageResponse<InventoryTransferResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_transfers', 'READ')")
    public InventoryTransferResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_transfers', 'WRITE')")
    public InventoryTransferResponse create(@Valid @RequestBody CreateInventoryTransferRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_transfers', 'WRITE')")
    public InventoryTransferResponse update(@PathVariable Long id, @RequestBody UpdateInventoryTransferRequest request) { return service.update(id, request); }
}
