package com.dgt.backend.inventory.controller;

import com.dgt.backend.inventory.dto.InventoryTransferItemResponse;
import com.dgt.backend.inventory.dto.CreateInventoryTransferItemRequest;
import com.dgt.backend.inventory.dto.UpdateInventoryTransferItemRequest;
import com.dgt.backend.inventory.service.InventoryTransferItemService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory-transfer-items")
public class InventoryTransferItemController {
    private final InventoryTransferItemService service;
    public InventoryTransferItemController(InventoryTransferItemService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_transfer_items', 'READ')")
    public PageResponse<InventoryTransferItemResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_transfer_items', 'READ')")
    public InventoryTransferItemResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_transfer_items', 'WRITE')")
    public InventoryTransferItemResponse create(@Valid @RequestBody CreateInventoryTransferItemRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_transfer_items', 'WRITE')")
    public InventoryTransferItemResponse update(@PathVariable Long id, @RequestBody UpdateInventoryTransferItemRequest request) { return service.update(id, request); }
}
