package com.dgt.backend.dailyclosing.controller;

import com.dgt.backend.dailyclosing.dto.DailyExpenseResponse;
import com.dgt.backend.dailyclosing.dto.CreateDailyExpenseRequest;
import com.dgt.backend.dailyclosing.dto.UpdateDailyExpenseRequest;
import com.dgt.backend.dailyclosing.service.DailyExpenseService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/daily-expenses")
public class DailyExpenseController {
    private final DailyExpenseService service;
    public DailyExpenseController(DailyExpenseService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_expenses', 'READ')")
    public PageResponse<DailyExpenseResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_expenses', 'READ')")
    public DailyExpenseResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_expenses', 'WRITE')")
    public DailyExpenseResponse create(@Valid @RequestBody CreateDailyExpenseRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_expenses', 'WRITE')")
    public DailyExpenseResponse update(@PathVariable Long id, @RequestBody UpdateDailyExpenseRequest request) { return service.update(id, request); }
}
