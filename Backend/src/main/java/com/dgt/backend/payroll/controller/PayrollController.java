package com.dgt.backend.payroll.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.payroll.service.PayrollService;
import lombok.extern.slf4j.Slf4j;

// Legacy payroll endpoint placeholder, currently blocked by AccessPolicy.
// Both operations delegate to an unavailable response rather than calculating or storing payroll.
@Slf4j
@RestController
@RequestMapping("/api/v1/payroll")
@PreAuthorize("@accessPolicy.check(authentication, 'payroll', 'READ')")
public class PayrollController {
    private final PayrollService service;
    public PayrollController(PayrollService service) { this.service=service; }
    // If reached past security, report that payroll results are not implemented here.
    @GetMapping public void get() { service.unavailable(); }
    // Accept the legacy request shape but perform no payroll writes.
    @PostMapping public void create(@RequestBody java.util.Map<String,Object> request) { service.unavailable(); }
}
