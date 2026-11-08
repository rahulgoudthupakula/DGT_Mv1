package com.dgt.backend.employees.controller;

import com.dgt.backend.employees.dto.EmployeeTimeEntryResponse;
import com.dgt.backend.employees.dto.CreateEmployeeTimeEntryRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeTimeEntryRequest;
import com.dgt.backend.employees.service.EmployeeTimeEntrieService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * Generic EmployeeTimeEntrie record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/employee-time-entries")
public class EmployeeTimeEntrieController {
    private final EmployeeTimeEntrieService service;
    public EmployeeTimeEntrieController(EmployeeTimeEntrieService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_entries', 'READ')")
    public PageResponse<EmployeeTimeEntryResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_entries', 'READ')")
    public EmployeeTimeEntryResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_entries', 'WRITE')")
    public EmployeeTimeEntryResponse create(@Valid @RequestBody CreateEmployeeTimeEntryRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_entries', 'WRITE')")
    public EmployeeTimeEntryResponse update(@PathVariable Long id, @RequestBody UpdateEmployeeTimeEntryRequest request) { return service.update(id, request); }
}
