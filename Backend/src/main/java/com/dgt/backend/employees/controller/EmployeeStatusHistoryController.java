package com.dgt.backend.employees.controller;

import com.dgt.backend.employees.dto.EmployeeStatusHistoryResponse;
import com.dgt.backend.employees.dto.CreateEmployeeStatusHistoryRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeStatusHistoryRequest;
import com.dgt.backend.employees.service.EmployeeStatusHistoryService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/employee-status-histories")
public class EmployeeStatusHistoryController {
    private final EmployeeStatusHistoryService service;
    public EmployeeStatusHistoryController(EmployeeStatusHistoryService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_status_history', 'READ')")
    public PageResponse<EmployeeStatusHistoryResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_status_history', 'READ')")
    public EmployeeStatusHistoryResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_status_history', 'WRITE')")
    public EmployeeStatusHistoryResponse create(@Valid @RequestBody CreateEmployeeStatusHistoryRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_status_history', 'WRITE')")
    public EmployeeStatusHistoryResponse update(@PathVariable Long id, @RequestBody UpdateEmployeeStatusHistoryRequest request) { return service.update(id, request); }
}
