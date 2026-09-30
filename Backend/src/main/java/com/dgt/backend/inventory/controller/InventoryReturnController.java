package com.dgt.backend.inventory.controller;

import com.dgt.backend.inventory.dto.InventoryReturnResponse;
import com.dgt.backend.inventory.dto.CreateInventoryReturnRequest;
import com.dgt.backend.inventory.dto.UpdateInventoryReturnRequest;
import com.dgt.backend.inventory.service.InventoryReturnService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory-returns")
public class InventoryReturnController {
    private final InventoryReturnService service;
    public InventoryReturnController(InventoryReturnService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_returns', 'READ')")
    public PageResponse<InventoryReturnResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_returns', 'READ')")
    public InventoryReturnResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_returns', 'WRITE')")
    public InventoryReturnResponse create(@Valid @RequestBody CreateInventoryReturnRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_returns', 'WRITE')")
    public InventoryReturnResponse update(@PathVariable Long id, @RequestBody UpdateInventoryReturnRequest request) { return service.update(id, request); }
}
