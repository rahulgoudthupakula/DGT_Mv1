package com.dgt.backend.employees.controller;

import com.dgt.backend.employees.dto.EmployeeDocumentResponse;
import com.dgt.backend.employees.dto.CreateEmployeeDocumentRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeDocumentRequest;
import com.dgt.backend.employees.service.EmployeeDocumentService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/employee-documents")
public class EmployeeDocumentController {
    private final EmployeeDocumentService service;
    public EmployeeDocumentController(EmployeeDocumentService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_documents', 'READ')")
    public PageResponse<EmployeeDocumentResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_documents', 'READ')")
    public EmployeeDocumentResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_documents', 'WRITE')")
    public EmployeeDocumentResponse create(@Valid @RequestBody CreateEmployeeDocumentRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'employee_documents', 'WRITE')")
    public EmployeeDocumentResponse update(@PathVariable Long id, @RequestBody UpdateEmployeeDocumentRequest request) { return service.update(id, request); }
}
