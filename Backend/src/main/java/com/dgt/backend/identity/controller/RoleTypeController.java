package com.dgt.backend.identity.controller;

import com.dgt.backend.identity.dto.RoleTypeResponse;
import com.dgt.backend.identity.dto.CreateRoleTypeRequest;
import com.dgt.backend.identity.dto.UpdateRoleTypeRequest;
import com.dgt.backend.identity.service.RoleTypeService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/role-types")
public class RoleTypeController {
    private final RoleTypeService service;
    public RoleTypeController(RoleTypeService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'role_types', 'READ')")
    public PageResponse<RoleTypeResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'role_types', 'READ')")
    public RoleTypeResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'role_types', 'WRITE')")
    public RoleTypeResponse create(@Valid @RequestBody CreateRoleTypeRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'role_types', 'WRITE')")
    public RoleTypeResponse update(@PathVariable Long id, @RequestBody UpdateRoleTypeRequest request) { return service.update(id, request); }
}
