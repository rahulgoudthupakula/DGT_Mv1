package com.dgt.backend.departments.controller;

import com.dgt.backend.departments.dto.StoreDepartmentResponse;
import com.dgt.backend.departments.dto.CreateStoreDepartmentRequest;
import com.dgt.backend.departments.dto.UpdateStoreDepartmentRequest;
import com.dgt.backend.departments.service.StoreDepartmentService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/store-departments")
public class StoreDepartmentController {
    private final StoreDepartmentService service;
    public StoreDepartmentController(StoreDepartmentService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'store_departments', 'READ')")
    public PageResponse<StoreDepartmentResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_departments', 'READ')")
    public StoreDepartmentResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'store_departments', 'WRITE')")
    public StoreDepartmentResponse create(@Valid @RequestBody CreateStoreDepartmentRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_departments', 'WRITE')")
    public StoreDepartmentResponse update(@PathVariable Long id, @RequestBody UpdateStoreDepartmentRequest request) { return service.update(id, request); }
}
