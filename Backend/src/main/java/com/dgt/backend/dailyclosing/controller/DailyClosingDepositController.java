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
import lombok.extern.slf4j.Slf4j;

/**
 * Generic DailyClosingDeposit CRUD API. AccessPolicy currently denies these routes.
 * The connected daily closing page uses StoreClosingController instead.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/daily-closing-deposits")
public class DailyClosingDepositController {
    private final DailyClosingDepositService service;
    public DailyClosingDepositController(DailyClosingDepositService service) { this.service = service; }

    /** List a zero-based page after the generic access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_deposits', 'READ')")
    public PageResponse<DailyClosingDepositResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Retrieve one record by primary key; an unknown identifier returns 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_deposits', 'READ')")
    public DailyClosingDepositResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_deposits', 'WRITE')")
    public DailyClosingDepositResponse create(@Valid @RequestBody CreateDailyClosingDepositRequest request) { return service.create(request); }

    /** Apply non-null request fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_deposits', 'WRITE')")
    public DailyClosingDepositResponse update(@PathVariable Long id, @RequestBody UpdateDailyClosingDepositRequest request) { return service.update(id, request); }
}
