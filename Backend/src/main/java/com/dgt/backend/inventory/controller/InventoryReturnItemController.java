package com.dgt.backend.inventory.controller;

import com.dgt.backend.inventory.dto.InventoryReturnItemResponse;
import com.dgt.backend.inventory.dto.CreateInventoryReturnItemRequest;
import com.dgt.backend.inventory.dto.UpdateInventoryReturnItemRequest;
import com.dgt.backend.inventory.service.InventoryReturnItemService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * Generic InventoryReturnItem record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory-return-items")
public class InventoryReturnItemController {
    private final InventoryReturnItemService service;
    public InventoryReturnItemController(InventoryReturnItemService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_return_items', 'READ')")
    public PageResponse<InventoryReturnItemResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_return_items', 'READ')")
    public InventoryReturnItemResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_return_items', 'WRITE')")
    public InventoryReturnItemResponse create(@Valid @RequestBody CreateInventoryReturnItemRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_return_items', 'WRITE')")
    public InventoryReturnItemResponse update(@PathVariable Long id, @RequestBody UpdateInventoryReturnItemRequest request) { return service.update(id, request); }
}
