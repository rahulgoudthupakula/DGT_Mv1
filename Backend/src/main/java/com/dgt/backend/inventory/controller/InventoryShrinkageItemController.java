package com.dgt.backend.inventory.controller;

import com.dgt.backend.inventory.dto.InventoryShrinkageItemResponse;
import com.dgt.backend.inventory.dto.CreateInventoryShrinkageItemRequest;
import com.dgt.backend.inventory.dto.UpdateInventoryShrinkageItemRequest;
import com.dgt.backend.inventory.service.InventoryShrinkageItemService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inventory-shrinkage-items")
public class InventoryShrinkageItemController {
    private final InventoryShrinkageItemService service;
    public InventoryShrinkageItemController(InventoryShrinkageItemService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_shrinkage_items', 'READ')")
    public PageResponse<InventoryShrinkageItemResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_shrinkage_items', 'READ')")
    public InventoryShrinkageItemResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_shrinkage_items', 'WRITE')")
    public InventoryShrinkageItemResponse create(@Valid @RequestBody CreateInventoryShrinkageItemRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_shrinkage_items', 'WRITE')")
    public InventoryShrinkageItemResponse update(@PathVariable Long id, @RequestBody UpdateInventoryShrinkageItemRequest request) { return service.update(id, request); }
}
