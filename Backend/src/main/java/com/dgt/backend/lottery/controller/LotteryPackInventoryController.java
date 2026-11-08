package com.dgt.backend.lottery.controller;

import com.dgt.backend.lottery.dto.LotteryPackInventoryResponse;
import com.dgt.backend.lottery.dto.CreateLotteryPackInventoryRequest;
import com.dgt.backend.lottery.dto.UpdateLotteryPackInventoryRequest;
import com.dgt.backend.lottery.service.LotteryPackInventoryService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * Generic LotteryPackInventory record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/lottery-pack-inventories")
public class LotteryPackInventoryController {
    private final LotteryPackInventoryService service;
    public LotteryPackInventoryController(LotteryPackInventoryService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory', 'READ')")
    public PageResponse<LotteryPackInventoryResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory', 'READ')")
    public LotteryPackInventoryResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory', 'WRITE')")
    public LotteryPackInventoryResponse create(@Valid @RequestBody CreateLotteryPackInventoryRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_pack_inventory', 'WRITE')")
    public LotteryPackInventoryResponse update(@PathVariable Long id, @RequestBody UpdateLotteryPackInventoryRequest request) { return service.update(id, request); }
}
