package com.dgt.backend.inventory.controller;

import com.dgt.backend.inventory.dto.InventoryReductionRequestResponse;
import com.dgt.backend.inventory.dto.CreateInventoryReductionRequestRequest;
import com.dgt.backend.inventory.dto.UpdateInventoryReductionRequestRequest;
import com.dgt.backend.inventory.service.InventoryReductionRequestService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inventory-reduction-requests")
public class InventoryReductionRequestController {
    private final InventoryReductionRequestService service;
    public InventoryReductionRequestController(InventoryReductionRequestService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_reduction_requests', 'READ')")
    public PageResponse<InventoryReductionRequestResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_reduction_requests', 'READ')")
    public InventoryReductionRequestResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_reduction_requests', 'WRITE')")
    public InventoryReductionRequestResponse create(@Valid @RequestBody CreateInventoryReductionRequestRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'inventory_reduction_requests', 'WRITE')")
    public InventoryReductionRequestResponse update(@PathVariable Long id, @RequestBody UpdateInventoryReductionRequestRequest request) { return service.update(id, request); }
}
