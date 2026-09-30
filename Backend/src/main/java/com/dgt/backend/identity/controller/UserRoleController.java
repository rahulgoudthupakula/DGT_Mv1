package com.dgt.backend.identity.controller;

import com.dgt.backend.identity.dto.UserRoleResponse;
import com.dgt.backend.identity.dto.CreateUserRoleRequest;
import com.dgt.backend.identity.dto.UpdateUserRoleRequest;
import com.dgt.backend.identity.service.UserRoleService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/user-roles")
public class UserRoleController {
    private final UserRoleService service;
    public UserRoleController(UserRoleService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'user_roles', 'READ')")
    public PageResponse<UserRoleResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'user_roles', 'READ')")
    public UserRoleResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'user_roles', 'WRITE')")
    public UserRoleResponse create(@Valid @RequestBody CreateUserRoleRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'user_roles', 'WRITE')")
    public UserRoleResponse update(@PathVariable Long id, @RequestBody UpdateUserRoleRequest request) { return service.update(id, request); }
}
