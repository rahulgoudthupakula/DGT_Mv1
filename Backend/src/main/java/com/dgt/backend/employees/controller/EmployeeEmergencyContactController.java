package com.dgt.backend.employees.controller;

import com.dgt.backend.employees.dto.EmployeeEmergencyContactResponse;
import com.dgt.backend.employees.dto.CreateEmployeeEmergencyContactRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeEmergencyContactRequest;
import com.dgt.backend.employees.service.EmployeeEmergencyContactService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/employee-emergency-contacts")
public class EmployeeEmergencyContactController {
    private final EmployeeEmergencyContactService service;
    public EmployeeEmergencyContactController(EmployeeEmergencyContactService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_emergency_contacts', 'READ')")
    public PageResponse<EmployeeEmergencyContactResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_emergency_contacts', 'READ')")
    public EmployeeEmergencyContactResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_emergency_contacts', 'WRITE')")
    public EmployeeEmergencyContactResponse create(@Valid @RequestBody CreateEmployeeEmergencyContactRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_emergency_contacts', 'WRITE')")
    public EmployeeEmergencyContactResponse update(@PathVariable Long id, @RequestBody UpdateEmployeeEmergencyContactRequest request) { return service.update(id, request); }
}
