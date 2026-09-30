package com.dgt.backend.departments.controller;

import com.dgt.backend.departments.dto.StoreSubDepartmentResponse;
import com.dgt.backend.departments.dto.CreateStoreSubDepartmentRequest;
import com.dgt.backend.departments.dto.UpdateStoreSubDepartmentRequest;
import com.dgt.backend.departments.service.StoreSubDepartmentService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/store-sub-departments")
public class StoreSubDepartmentController {
    private final StoreSubDepartmentService service;
    public StoreSubDepartmentController(StoreSubDepartmentService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'store_sub_departments', 'READ')")
    public PageResponse<StoreSubDepartmentResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_sub_departments', 'READ')")
    public StoreSubDepartmentResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'store_sub_departments', 'WRITE')")
    public StoreSubDepartmentResponse create(@Valid @RequestBody CreateStoreSubDepartmentRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_sub_departments', 'WRITE')")
    public StoreSubDepartmentResponse update(@PathVariable Long id, @RequestBody UpdateStoreSubDepartmentRequest request) { return service.update(id, request); }
}
