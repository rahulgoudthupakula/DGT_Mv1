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

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {
    private final InventoryService service;
    public InventoryController(InventoryService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory', 'READ')")
    public PageResponse<InventoryResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        log.debug("GET /inventory page={} size={}", page, size);
        return service.list(page, size);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory', 'READ')")
    public InventoryResponse get(@PathVariable Long id) {
        log.debug("GET /inventory/{}", id);
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory', 'WRITE')")
    public InventoryResponse create(@Valid @RequestBody CreateInventoryRequest request) {
        log.info("POST /inventory");
        var result = service.create(request);
        log.info("Created inventory id={}", result.inventoryId());
        return result;
    }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory', 'WRITE')")
    public InventoryResponse update(@PathVariable Long id, @RequestBody UpdateInventoryRequest request) {
        log.info("PATCH /inventory/{}", id);
        return service.update(id, request);
    }
}
