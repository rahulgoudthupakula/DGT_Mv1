package com.dgt.backend.employees.controller;

import com.dgt.backend.employees.dto.EmployeeCompensationResponse;
import com.dgt.backend.employees.dto.CreateEmployeeCompensationRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeCompensationRequest;
import com.dgt.backend.employees.service.EmployeeCompensationService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * Generic EmployeeCompensation record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/employee-compensations")
public class EmployeeCompensationController {
    private final EmployeeCompensationService service;
    public EmployeeCompensationController(EmployeeCompensationService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_compensation', 'READ')")
    public PageResponse<EmployeeCompensationResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_compensation', 'READ')")
    public EmployeeCompensationResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_compensation', 'WRITE')")
    public EmployeeCompensationResponse create(@Valid @RequestBody CreateEmployeeCompensationRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_compensation', 'WRITE')")
    public EmployeeCompensationResponse update(@PathVariable Long id, @RequestBody UpdateEmployeeCompensationRequest request) { return service.update(id, request); }
}
