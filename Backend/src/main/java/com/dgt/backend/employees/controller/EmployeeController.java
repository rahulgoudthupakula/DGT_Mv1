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

/**
 * Generic Employee record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {
    private final EmployeeService service;
    public EmployeeController(EmployeeService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'employees', 'READ')")
    public PageResponse<EmployeeResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employees', 'READ')")
    public EmployeeResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'employees', 'WRITE')")
    public EmployeeResponse create(@Valid @RequestBody CreateEmployeeRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employees', 'WRITE')")
    public EmployeeResponse update(@PathVariable Long id, @RequestBody UpdateEmployeeRequest request) { return service.update(id, request); }
}
