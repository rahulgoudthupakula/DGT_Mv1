package com.dgt.backend.identity.controller;

import com.dgt.backend.identity.dto.ModuleResponse;
import com.dgt.backend.identity.dto.CreateModuleRequest;
import com.dgt.backend.identity.dto.UpdateModuleRequest;
import com.dgt.backend.identity.service.ModuleService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/modules")
public class ModuleController {
    private final ModuleService service;
    public ModuleController(ModuleService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'modules', 'READ')")
    public PageResponse<ModuleResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'modules', 'READ')")
    public ModuleResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'modules', 'WRITE')")
    public ModuleResponse create(@Valid @RequestBody CreateModuleRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'modules', 'WRITE')")
    public ModuleResponse update(@PathVariable Long id, @RequestBody UpdateModuleRequest request) { return service.update(id, request); }
}
