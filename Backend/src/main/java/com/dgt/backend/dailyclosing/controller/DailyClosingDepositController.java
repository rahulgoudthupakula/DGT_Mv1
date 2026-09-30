package com.dgt.backend.dailyclosing.controller;

import com.dgt.backend.dailyclosing.dto.DailyClosingDepositResponse;
import com.dgt.backend.dailyclosing.dto.CreateDailyClosingDepositRequest;
import com.dgt.backend.dailyclosing.dto.UpdateDailyClosingDepositRequest;
import com.dgt.backend.dailyclosing.service.DailyClosingDepositService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/daily-closing-deposits")
public class DailyClosingDepositController {
    private final DailyClosingDepositService service;
    public DailyClosingDepositController(DailyClosingDepositService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_deposits', 'READ')")
    public PageResponse<DailyClosingDepositResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_deposits', 'READ')")
    public DailyClosingDepositResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_deposits', 'WRITE')")
    public DailyClosingDepositResponse create(@Valid @RequestBody CreateDailyClosingDepositRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_deposits', 'WRITE')")
    public DailyClosingDepositResponse update(@PathVariable Long id, @RequestBody UpdateDailyClosingDepositRequest request) { return service.update(id, request); }
}
