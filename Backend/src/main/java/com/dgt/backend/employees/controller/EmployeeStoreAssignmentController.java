package com.dgt.backend.employees.controller;

import com.dgt.backend.employees.dto.EmployeeStoreAssignmentResponse;
import com.dgt.backend.employees.dto.CreateEmployeeStoreAssignmentRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeStoreAssignmentRequest;
import com.dgt.backend.employees.service.EmployeeStoreAssignmentService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/employee-store-assignments")
public class EmployeeStoreAssignmentController {
    private final EmployeeStoreAssignmentService service;
    public EmployeeStoreAssignmentController(EmployeeStoreAssignmentService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_store_assignments', 'READ')")
    public PageResponse<EmployeeStoreAssignmentResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_store_assignments', 'READ')")
    public EmployeeStoreAssignmentResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_store_assignments', 'WRITE')")
    public EmployeeStoreAssignmentResponse create(@Valid @RequestBody CreateEmployeeStoreAssignmentRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_store_assignments', 'WRITE')")
    public EmployeeStoreAssignmentResponse update(@PathVariable Long id, @RequestBody UpdateEmployeeStoreAssignmentRequest request) { return service.update(id, request); }
}
