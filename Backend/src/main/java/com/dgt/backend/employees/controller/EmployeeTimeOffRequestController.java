package com.dgt.backend.employees.controller;

import com.dgt.backend.employees.dto.EmployeeTimeOffRequestResponse;
import com.dgt.backend.employees.dto.CreateEmployeeTimeOffRequestRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeTimeOffRequestRequest;
import com.dgt.backend.employees.service.EmployeeTimeOffRequestService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/employee-time-off-requests")
public class EmployeeTimeOffRequestController {
    private final EmployeeTimeOffRequestService service;
    public EmployeeTimeOffRequestController(EmployeeTimeOffRequestService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_off_requests', 'READ')")
    public PageResponse<EmployeeTimeOffRequestResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_off_requests', 'READ')")
    public EmployeeTimeOffRequestResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_off_requests', 'WRITE')")
    public EmployeeTimeOffRequestResponse create(@Valid @RequestBody CreateEmployeeTimeOffRequestRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_off_requests', 'WRITE')")
    public EmployeeTimeOffRequestResponse update(@PathVariable Long id, @RequestBody UpdateEmployeeTimeOffRequestRequest request) { return service.update(id, request); }
}
