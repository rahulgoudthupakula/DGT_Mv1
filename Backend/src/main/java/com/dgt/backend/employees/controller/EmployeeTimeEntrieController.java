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

@RestController
@RequestMapping("/api/v1/employee-time-entries")
public class EmployeeTimeEntrieController {
    private final EmployeeTimeEntrieService service;
    public EmployeeTimeEntrieController(EmployeeTimeEntrieService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_entries', 'READ')")
    public PageResponse<EmployeeTimeEntryResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_entries', 'READ')")
    public EmployeeTimeEntryResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_entries', 'WRITE')")
    public EmployeeTimeEntryResponse create(@Valid @RequestBody CreateEmployeeTimeEntryRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_entries', 'WRITE')")
    public EmployeeTimeEntryResponse update(@PathVariable Long id, @RequestBody UpdateEmployeeTimeEntryRequest request) { return service.update(id, request); }
}
