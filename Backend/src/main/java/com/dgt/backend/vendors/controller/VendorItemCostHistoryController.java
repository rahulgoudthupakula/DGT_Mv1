package com.dgt.backend.vendors.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.vendors.service.VendorItemCostHistoryService;
import com.dgt.backend.vendors.entity.VendorItemCostHistory;
@RestController
@RequestMapping("/api/v1/vendor-item-cost-history")
public class VendorItemCostHistoryController {
    private final VendorItemCostHistoryService service;
    public VendorItemCostHistoryController(VendorItemCostHistoryService service) { this.service=service; }
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_item_cost_history', 'READ')")
    public Map<String,Object> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size) { return service.list(page,size); }
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_item_cost_history', 'READ')")
    public VendorItemCostHistory get(@PathVariable Long id) { return service.get(id); }
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_item_cost_history', 'WRITE')")
    public Map<String,Object> create(@RequestBody Map<String,Object> values) { return service.create(values); }
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'vendor_item_cost_history', 'WRITE')")
    public Map<String,Object> update(@PathVariable Long id,@RequestHeader("If-Match") String expected,@RequestBody Map<String,Object> values) { return service.update(id,values,expected); }
}
