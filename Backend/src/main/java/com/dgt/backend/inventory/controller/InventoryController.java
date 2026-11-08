package com.dgt.backend.inventory.controller;

import com.dgt.backend.inventory.dto.CreateInventoryRequest;
import com.dgt.backend.inventory.dto.InventoryResponse;
import com.dgt.backend.inventory.dto.UpdateInventoryRequest;
import com.dgt.backend.inventory.service.InventoryService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Generic Inventory record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {
    private final InventoryService service;
    public InventoryController(InventoryService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory', 'READ')")
    public PageResponse<InventoryResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        log.debug("GET /inventory page={} size={}", page, size);
        return service.list(page, size);
    }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory', 'READ')")
    public InventoryResponse get(@PathVariable Long id) {
        log.debug("GET /inventory/{}", id);
        return service.get(id);
    }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory', 'WRITE')")
    public InventoryResponse create(@Valid @RequestBody CreateInventoryRequest request) {
        log.info("POST /inventory");
        var result = service.create(request);
        log.info("Created inventory id={}", result.inventoryId());
        return result;
    }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory', 'WRITE')")
    public InventoryResponse update(@PathVariable Long id, @RequestBody UpdateInventoryRequest request) {
        log.info("PATCH /inventory/{}", id);
        return service.update(id, request);
    }
}
