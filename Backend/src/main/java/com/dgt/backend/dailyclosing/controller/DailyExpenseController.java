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
import lombok.extern.slf4j.Slf4j;

/**
 * Generic DailyExpense CRUD API. AccessPolicy currently denies these routes.
 * The connected daily closing page uses StoreClosingController instead.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/daily-expenses")
public class DailyExpenseController {
    private final DailyExpenseService service;
    public DailyExpenseController(DailyExpenseService service) { this.service = service; }

    /** List a zero-based page after the generic access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_expenses', 'READ')")
    public PageResponse<DailyExpenseResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Retrieve one record by primary key; an unknown identifier returns 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_expenses', 'READ')")
    public DailyExpenseResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_expenses', 'WRITE')")
    public DailyExpenseResponse create(@Valid @RequestBody CreateDailyExpenseRequest request) { return service.create(request); }

    /** Apply non-null request fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_expenses', 'WRITE')")
    public DailyExpenseResponse update(@PathVariable Long id, @RequestBody UpdateDailyExpenseRequest request) { return service.update(id, request); }
}
