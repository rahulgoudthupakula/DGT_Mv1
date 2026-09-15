package com.dgt.backend.identity.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.identity.service.PermissionService;
import com.dgt.backend.identity.entity.Permission;
@RestController
@RequestMapping("/api/v1/permissions")
public class PermissionController {
    private final PermissionService service;
    public PermissionController(PermissionService service) { this.service=service; }
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'permissions', 'READ')")
    public Map<String,Object> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size) { return service.list(page,size); }
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'permissions', 'READ')")
    public Permission get(@PathVariable Long id) { return service.get(id); }
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'permissions', 'WRITE')")
    public Map<String,Object> create(@RequestBody Map<String,Object> values) { return service.create(values); }
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'permissions', 'WRITE')")
    public Map<String,Object> update(@PathVariable Long id,@RequestHeader("If-Match") String expected,@RequestBody Map<String,Object> values) { return service.update(id,values,expected); }
}
