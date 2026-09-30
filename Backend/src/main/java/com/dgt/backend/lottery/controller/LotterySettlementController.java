package com.dgt.backend.lottery.controller;

import com.dgt.backend.lottery.dto.LotterySettlementResponse;
import com.dgt.backend.lottery.dto.CreateLotterySettlementRequest;
import com.dgt.backend.lottery.dto.UpdateLotterySettlementRequest;
import com.dgt.backend.lottery.service.LotterySettlementService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/lottery-settlements")
public class LotterySettlementController {
    private final LotterySettlementService service;
    public LotterySettlementController(LotterySettlementService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_settlements', 'READ')")
    public PageResponse<LotterySettlementResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_settlements', 'READ')")
    public LotterySettlementResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_settlements', 'WRITE')")
    public LotterySettlementResponse create(@Valid @RequestBody CreateLotterySettlementRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_settlements', 'WRITE')")
    public LotterySettlementResponse update(@PathVariable Long id, @RequestBody UpdateLotterySettlementRequest request) { return service.update(id, request); }
}
