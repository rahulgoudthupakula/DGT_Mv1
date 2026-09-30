package com.dgt.backend.lottery.controller;

import com.dgt.backend.lottery.dto.LotteryPackResponse;
import com.dgt.backend.lottery.dto.CreateLotteryPackRequest;
import com.dgt.backend.lottery.dto.UpdateLotteryPackRequest;
import com.dgt.backend.lottery.service.LotteryPackService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/lottery-packs")
public class LotteryPackController {
    private final LotteryPackService service;
    public LotteryPackController(LotteryPackService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_packs', 'READ')")
    public PageResponse<LotteryPackResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_packs', 'READ')")
    public LotteryPackResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_packs', 'WRITE')")
    public LotteryPackResponse create(@Valid @RequestBody CreateLotteryPackRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_packs', 'WRITE')")
    public LotteryPackResponse update(@PathVariable Long id, @RequestBody UpdateLotteryPackRequest request) { return service.update(id, request); }
}
