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

/**
 * Generic Module record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/modules")
public class ModuleController {
    private final ModuleService service;
    public ModuleController(ModuleService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'modules', 'READ')")
    public PageResponse<ModuleResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'modules', 'READ')")
    public ModuleResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'modules', 'WRITE')")
    public ModuleResponse create(@Valid @RequestBody CreateModuleRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'modules', 'WRITE')")
    public ModuleResponse update(@PathVariable Long id, @RequestBody UpdateModuleRequest request) { return service.update(id, request); }
}
