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

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory-return-items")
public class InventoryReturnItemController {
    private final InventoryReturnItemService service;
    public InventoryReturnItemController(InventoryReturnItemService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_return_items', 'READ')")
    public PageResponse<InventoryReturnItemResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_return_items', 'READ')")
    public InventoryReturnItemResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_return_items', 'WRITE')")
    public InventoryReturnItemResponse create(@Valid @RequestBody CreateInventoryReturnItemRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_return_items', 'WRITE')")
    public InventoryReturnItemResponse update(@PathVariable Long id, @RequestBody UpdateInventoryReturnItemRequest request) { return service.update(id, request); }
}
