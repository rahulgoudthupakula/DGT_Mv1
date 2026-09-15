package com.dgt.backend.inventorymovements.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.inventorymovements.service.InventoryMovementService;
import com.dgt.backend.inventorymovements.entity.InventoryMovement;
@RestController
@RequestMapping("/api/v1/inventory-movements")
public class InventoryMovementController {
    private final InventoryMovementService service;
    public InventoryMovementController(InventoryMovementService service) { this.service=service; }
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_movements', 'READ')")
    public Map<String,Object> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size) { return service.list(page,size); }
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_movements', 'READ')")
    public InventoryMovement get(@PathVariable Long id) { return service.get(id); }
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_movements', 'WRITE')")
    public Map<String,Object> create(@RequestBody Map<String,Object> values) { return service.create(values); }
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_movements', 'WRITE')")
    public Map<String,Object> update(@PathVariable Long id,@RequestHeader("If-Match") String expected,@RequestBody Map<String,Object> values) { return service.update(id,values,expected); }
}
