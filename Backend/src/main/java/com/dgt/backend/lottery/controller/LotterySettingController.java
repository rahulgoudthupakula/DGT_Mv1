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
import lombok.extern.slf4j.Slf4j;

/**
 * Generic LotterySetting record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/lottery-settings")
public class LotterySettingController {
    private final LotterySettingService service;
    public LotterySettingController(LotterySettingService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_settings', 'READ')")
    public PageResponse<LotterySettingResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_settings', 'READ')")
    public LotterySettingResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_settings', 'WRITE')")
    public LotterySettingResponse create(@Valid @RequestBody CreateLotterySettingRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_settings', 'WRITE')")
    public LotterySettingResponse update(@PathVariable Long id, @RequestBody UpdateLotterySettingRequest request) { return service.update(id, request); }
}
