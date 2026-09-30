package com.dgt.backend.inventory.controller;

import com.dgt.backend.inventory.dto.CreateInventoryRequest;
import com.dgt.backend.inventory.dto.InventoryResponse;
import com.dgt.backend.inventory.dto.UpdateInventoryRequest;
import com.dgt.backend.inventory.service.InventoryService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {
    private final InventoryService service;
    public InventoryController(InventoryService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory', 'READ')")
    public PageResponse<InventoryResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return service.list(page, size);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory', 'READ')")
    public InventoryResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory', 'WRITE')")
    public InventoryResponse create(@Valid @RequestBody CreateInventoryRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory', 'WRITE')")
    public InventoryResponse update(@PathVariable Long id, @RequestBody UpdateInventoryRequest request) {
        return service.update(id, request);
    }
}
