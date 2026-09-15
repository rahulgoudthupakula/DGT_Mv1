package com.dgt.backend.departments.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.departments.service.StoreDepartmentService;
import com.dgt.backend.departments.entity.StoreDepartment;
@RestController
@RequestMapping("/api/v1/store-departments")
public class StoreDepartmentController {
    private final StoreDepartmentService service;
    public StoreDepartmentController(StoreDepartmentService service) { this.service=service; }
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'store_departments', 'READ')")
    public Map<String,Object> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size) { return service.list(page,size); }
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_departments', 'READ')")
    public StoreDepartment get(@PathVariable Long id) { return service.get(id); }
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'store_departments', 'WRITE')")
    public Map<String,Object> create(@RequestBody Map<String,Object> values) { return service.create(values); }
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_departments', 'WRITE')")
    public Map<String,Object> update(@PathVariable Long id,@RequestHeader("If-Match") String expected,@RequestBody Map<String,Object> values) { return service.update(id,values,expected); }
}
