package com.dgt.backend.lottery.controller;

import com.dgt.backend.lottery.dto.LotteryPackInventoryItemResponse;
import com.dgt.backend.lottery.dto.CreateLotteryPackInventoryItemRequest;
import com.dgt.backend.lottery.dto.UpdateLotteryPackInventoryItemRequest;
import com.dgt.backend.lottery.service.LotteryPackInventoryItemService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/lottery-pack-inventory-items")
public class LotteryPackInventoryItemController {
    private final LotteryPackInventoryItemService service;
    public LotteryPackInventoryItemController(LotteryPackInventoryItemService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory_items', 'READ')")
    public PageResponse<LotteryPackInventoryItemResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory_items', 'READ')")
    public LotteryPackInventoryItemResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory_items', 'WRITE')")
    public LotteryPackInventoryItemResponse create(@Valid @RequestBody CreateLotteryPackInventoryItemRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory_items', 'WRITE')")
    public LotteryPackInventoryItemResponse update(@PathVariable Long id, @RequestBody UpdateLotteryPackInventoryItemRequest request) { return service.update(id, request); }
}
