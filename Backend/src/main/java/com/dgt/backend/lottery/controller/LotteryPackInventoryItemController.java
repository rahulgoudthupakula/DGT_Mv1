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

/**
 * Generic LotteryPackInventoryItem record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/lottery-pack-inventory-items")
public class LotteryPackInventoryItemController {
    private final LotteryPackInventoryItemService service;
    public LotteryPackInventoryItemController(LotteryPackInventoryItemService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory_items', 'READ')")
    public PageResponse<LotteryPackInventoryItemResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory_items', 'READ')")
    public LotteryPackInventoryItemResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory_items', 'WRITE')")
    public LotteryPackInventoryItemResponse create(@Valid @RequestBody CreateLotteryPackInventoryItemRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory_items', 'WRITE')")
    public LotteryPackInventoryItemResponse update(@PathVariable Long id, @RequestBody UpdateLotteryPackInventoryItemRequest request) { return service.update(id, request); }
}
