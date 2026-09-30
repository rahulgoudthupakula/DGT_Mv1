package com.dgt.backend.identity.controller;

import com.dgt.backend.identity.dto.PermissionResponse;
import com.dgt.backend.identity.dto.CreatePermissionRequest;
import com.dgt.backend.identity.dto.UpdatePermissionRequest;
import com.dgt.backend.identity.service.PermissionService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/permissions")
public class PermissionController {
    private final PermissionService service;
    public PermissionController(PermissionService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'permissions', 'READ')")
    public PageResponse<PermissionResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'permissions', 'READ')")
    public PermissionResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'permissions', 'WRITE')")
    public PermissionResponse create(@Valid @RequestBody CreatePermissionRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'permissions', 'WRITE')")
    public PermissionResponse update(@PathVariable Long id, @RequestBody UpdatePermissionRequest request) { return service.update(id, request); }
}
