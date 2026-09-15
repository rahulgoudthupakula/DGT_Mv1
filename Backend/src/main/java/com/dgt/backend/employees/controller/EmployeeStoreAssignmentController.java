package com.dgt.backend.employees.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.employees.service.EmployeeStoreAssignmentService;
import com.dgt.backend.employees.entity.EmployeeStoreAssignment;
@RestController
@RequestMapping("/api/v1/employee-store-assignments")
public class EmployeeStoreAssignmentController {
    private final EmployeeStoreAssignmentService service;
    public EmployeeStoreAssignmentController(EmployeeStoreAssignmentService service) { this.service=service; }
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_store_assignments', 'READ')")
    public Map<String,Object> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size) { return service.list(page,size); }
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_store_assignments', 'READ')")
    public EmployeeStoreAssignment get(@PathVariable Long id) { return service.get(id); }
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_store_assignments', 'WRITE')")
    public Map<String,Object> create(@RequestBody Map<String,Object> values) { return service.create(values); }
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_store_assignments', 'WRITE')")
    public Map<String,Object> update(@PathVariable Long id,@RequestHeader("If-Match") String expected,@RequestBody Map<String,Object> values) { return service.update(id,values,expected); }
}
