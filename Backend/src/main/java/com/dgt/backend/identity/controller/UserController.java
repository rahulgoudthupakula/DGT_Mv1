package com.dgt.backend.identity.controller;

import com.dgt.backend.identity.dto.UserResponse;
import com.dgt.backend.identity.dto.CreateUserRequest;
import com.dgt.backend.identity.dto.UpdateUserRequest;
import com.dgt.backend.identity.service.UserService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final UserService service;
    public UserController(UserService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'users', 'READ')")
    public PageResponse<UserResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'users', 'READ')")
    public UserResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'users', 'WRITE')")
    public UserResponse create(@Valid @RequestBody CreateUserRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'users', 'WRITE')")
    public UserResponse update(@PathVariable Long id, @RequestBody UpdateUserRequest request) { return service.update(id, request); }
}
