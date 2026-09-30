package com.dgt.backend.inventory.controller;

import com.dgt.backend.inventory.dto.InventoryShrinkageResponse;
import com.dgt.backend.inventory.dto.CreateInventoryShrinkageRequest;
import com.dgt.backend.inventory.dto.UpdateInventoryShrinkageRequest;
import com.dgt.backend.inventory.service.InventoryShrinkageService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory-shrinkages")
public class InventoryShrinkageController {
    private final InventoryShrinkageService service;
    public InventoryShrinkageController(InventoryShrinkageService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_shrinkage', 'READ')")
    public PageResponse<InventoryShrinkageResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_shrinkage', 'READ')")
    public InventoryShrinkageResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_shrinkage', 'WRITE')")
    public InventoryShrinkageResponse create(@Valid @RequestBody CreateInventoryShrinkageRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_shrinkage', 'WRITE')")
    public InventoryShrinkageResponse update(@PathVariable Long id, @RequestBody UpdateInventoryShrinkageRequest request) { return service.update(id, request); }
}
