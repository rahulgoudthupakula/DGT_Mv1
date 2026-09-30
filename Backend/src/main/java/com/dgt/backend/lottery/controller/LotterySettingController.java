package com.dgt.backend.lottery.controller;

import com.dgt.backend.lottery.dto.LotterySettingResponse;
import com.dgt.backend.lottery.dto.CreateLotterySettingRequest;
import com.dgt.backend.lottery.dto.UpdateLotterySettingRequest;
import com.dgt.backend.lottery.service.LotterySettingService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/lottery-settings")
public class LotterySettingController {
    private final LotterySettingService service;
    public LotterySettingController(LotterySettingService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_settings', 'READ')")
    public PageResponse<LotterySettingResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_settings', 'READ')")
    public LotterySettingResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_settings', 'WRITE')")
    public LotterySettingResponse create(@Valid @RequestBody CreateLotterySettingRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_settings', 'WRITE')")
    public LotterySettingResponse update(@PathVariable Long id, @RequestBody UpdateLotterySettingRequest request) { return service.update(id, request); }
}
