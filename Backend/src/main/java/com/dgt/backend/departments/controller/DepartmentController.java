package com.dgt.backend.departments.controller;

import com.dgt.backend.departments.dto.DepartmentResponse;
import com.dgt.backend.departments.dto.CreateDepartmentRequest;
import com.dgt.backend.departments.dto.UpdateDepartmentRequest;
import com.dgt.backend.departments.service.DepartmentService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * Generic Department record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/departments")
public class DepartmentController {
    private final DepartmentService service;
    public DepartmentController(DepartmentService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'departments', 'READ')")
    public PageResponse<DepartmentResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'departments', 'READ')")
    public DepartmentResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'departments', 'WRITE')")
    public DepartmentResponse create(@Valid @RequestBody CreateDepartmentRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'departments', 'WRITE')")
    public DepartmentResponse update(@PathVariable Long id, @RequestBody UpdateDepartmentRequest request) { return service.update(id, request); }
}
