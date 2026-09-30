package com.dgt.backend.dailyclosing.controller;

import com.dgt.backend.dailyclosing.dto.DailyClosingTenderResponse;
import com.dgt.backend.dailyclosing.dto.CreateDailyClosingTenderRequest;
import com.dgt.backend.dailyclosing.dto.UpdateDailyClosingTenderRequest;
import com.dgt.backend.dailyclosing.service.DailyClosingTenderService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/daily-closing-tenders")
public class DailyClosingTenderController {
    private final DailyClosingTenderService service;
    public DailyClosingTenderController(DailyClosingTenderService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_tenders', 'READ')")
    public PageResponse<DailyClosingTenderResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_tenders', 'READ')")
    public DailyClosingTenderResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_tenders', 'WRITE')")
    public DailyClosingTenderResponse create(@Valid @RequestBody CreateDailyClosingTenderRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_tenders', 'WRITE')")
    public DailyClosingTenderResponse update(@PathVariable Long id, @RequestBody UpdateDailyClosingTenderRequest request) { return service.update(id, request); }
}
