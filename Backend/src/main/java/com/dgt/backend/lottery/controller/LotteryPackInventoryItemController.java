package com.dgt.backend.lottery.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.lottery.service.LotteryPackInventoryItemService;
import com.dgt.backend.lottery.entity.LotteryPackInventoryItem;
@RestController
@RequestMapping("/api/v1/lottery-pack-inventory-items")
public class LotteryPackInventoryItemController {
    private final LotteryPackInventoryItemService service;
    public LotteryPackInventoryItemController(LotteryPackInventoryItemService service) { this.service=service; }
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory_items', 'READ')")
    public Map<String,Object> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size) { return service.list(page,size); }
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory_items', 'READ')")
    public LotteryPackInventoryItem get(@PathVariable Long id) { return service.get(id); }
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory_items', 'WRITE')")
    public Map<String,Object> create(@RequestBody Map<String,Object> values) { return service.create(values); }
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory_items', 'WRITE')")
    public Map<String,Object> update(@PathVariable Long id,@RequestHeader("If-Match") String expected,@RequestBody Map<String,Object> values) { return service.update(id,values,expected); }
}
