package com.dgt.backend.inventorymovements.controller;

import com.dgt.backend.inventorymovements.dto.InventoryMovementResponse;
import com.dgt.backend.inventorymovements.dto.CreateInventoryMovementRequest;
import com.dgt.backend.inventorymovements.dto.UpdateInventoryMovementRequest;
import com.dgt.backend.inventorymovements.service.InventoryMovementService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * Generic InventoryMovement record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory-movements")
public class InventoryMovementController {
    private final InventoryMovementService service;
    public InventoryMovementController(InventoryMovementService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_movements', 'READ')")
    public PageResponse<InventoryMovementResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_movements', 'READ')")
    public InventoryMovementResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_movements', 'WRITE')")
    public InventoryMovementResponse create(@Valid @RequestBody CreateInventoryMovementRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_movements', 'WRITE')")
    public InventoryMovementResponse update(@PathVariable Long id, @RequestBody UpdateInventoryMovementRequest request) { return service.update(id, request); }
}
