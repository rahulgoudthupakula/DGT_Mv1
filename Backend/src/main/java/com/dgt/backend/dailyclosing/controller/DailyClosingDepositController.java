package com.dgt.backend.dailyclosing.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.dailyclosing.service.DailyClosingDepositService;
import com.dgt.backend.dailyclosing.entity.DailyClosingDeposit;
@RestController
@RequestMapping("/api/v1/daily-closing-deposits")
public class DailyClosingDepositController {
    private final DailyClosingDepositService service;
    public DailyClosingDepositController(DailyClosingDepositService service) { this.service=service; }
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_deposits', 'READ')")
    public Map<String,Object> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size) { return service.list(page,size); }
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_deposits', 'READ')")
    public DailyClosingDeposit get(@PathVariable Long id) { return service.get(id); }
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_deposits', 'WRITE')")
    public Map<String,Object> create(@RequestBody Map<String,Object> values) { return service.create(values); }
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'daily_closing_deposits', 'WRITE')")
    public Map<String,Object> update(@PathVariable Long id,@RequestHeader("If-Match") String expected,@RequestBody Map<String,Object> values) { return service.update(id,values,expected); }
}
