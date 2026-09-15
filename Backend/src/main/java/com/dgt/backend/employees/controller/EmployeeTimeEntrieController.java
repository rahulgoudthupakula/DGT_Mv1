package com.dgt.backend.employees.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.employees.service.EmployeeTimeEntrieService;
import com.dgt.backend.employees.entity.EmployeeTimeEntrie;
@RestController
@RequestMapping("/api/v1/employee-time-entries")
public class EmployeeTimeEntrieController {
    private final EmployeeTimeEntrieService service;
    public EmployeeTimeEntrieController(EmployeeTimeEntrieService service) { this.service=service; }
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_entries', 'READ')")
    public Map<String,Object> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size) { return service.list(page,size); }
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_entries', 'READ')")
    public EmployeeTimeEntrie get(@PathVariable Long id) { return service.get(id); }
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_entries', 'WRITE')")
    public Map<String,Object> create(@RequestBody Map<String,Object> values) { return service.create(values); }
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_time_entries', 'WRITE')")
    public Map<String,Object> update(@PathVariable Long id,@RequestHeader("If-Match") String expected,@RequestBody Map<String,Object> values) { return service.update(id,values,expected); }
}
