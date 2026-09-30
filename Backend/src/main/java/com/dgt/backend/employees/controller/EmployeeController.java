package com.dgt.backend.employees.controller;

import com.dgt.backend.employees.dto.EmployeeResponse;
import com.dgt.backend.employees.dto.CreateEmployeeRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeRequest;
import com.dgt.backend.employees.service.EmployeeService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {
    private final EmployeeService service;
    public EmployeeController(EmployeeService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'employees', 'READ')")
    public PageResponse<EmployeeResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employees', 'READ')")
    public EmployeeResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'employees', 'WRITE')")
    public EmployeeResponse create(@Valid @RequestBody CreateEmployeeRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employees', 'WRITE')")
    public EmployeeResponse update(@PathVariable Long id, @RequestBody UpdateEmployeeRequest request) { return service.update(id, request); }
}
