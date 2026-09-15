package com.dgt.backend.employees.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.employees.service.EmployeeEmergencyContactService;
import com.dgt.backend.employees.entity.EmployeeEmergencyContact;
@RestController
@RequestMapping("/api/v1/employee-emergency-contacts")
public class EmployeeEmergencyContactController {
    private final EmployeeEmergencyContactService service;
    public EmployeeEmergencyContactController(EmployeeEmergencyContactService service) { this.service=service; }
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_emergency_contacts', 'READ')")
    public Map<String,Object> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size) { return service.list(page,size); }
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_emergency_contacts', 'READ')")
    public EmployeeEmergencyContact get(@PathVariable Long id) { return service.get(id); }
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_emergency_contacts', 'WRITE')")
    public Map<String,Object> create(@RequestBody Map<String,Object> values) { return service.create(values); }
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_emergency_contacts', 'WRITE')")
    public Map<String,Object> update(@PathVariable Long id,@RequestHeader("If-Match") String expected,@RequestBody Map<String,Object> values) { return service.update(id,values,expected); }
}
