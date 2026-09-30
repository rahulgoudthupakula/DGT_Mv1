package com.dgt.backend.sales.controller;

import com.dgt.backend.sales.dto.SaleItemResponse;
import com.dgt.backend.sales.dto.CreateSaleItemRequest;
import com.dgt.backend.sales.dto.UpdateSaleItemRequest;
import com.dgt.backend.sales.service.SaleItemService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/sale-items")
public class SaleItemController {
    private final SaleItemService service;
    public SaleItemController(SaleItemService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'sales_items', 'READ')")
    public PageResponse<SaleItemResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'sales_items', 'READ')")
    public SaleItemResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'sales_items', 'WRITE')")
    public SaleItemResponse create(@Valid @RequestBody CreateSaleItemRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'sales_items', 'WRITE')")
    public SaleItemResponse update(@PathVariable Long id, @RequestBody UpdateSaleItemRequest request) { return service.update(id, request); }
}
