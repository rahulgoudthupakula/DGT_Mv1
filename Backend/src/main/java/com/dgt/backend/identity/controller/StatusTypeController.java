package com.dgt.backend.identity.controller;

import com.dgt.backend.identity.dto.StatusTypeResponse;
import com.dgt.backend.identity.dto.CreateStatusTypeRequest;
import com.dgt.backend.identity.dto.UpdateStatusTypeRequest;
import com.dgt.backend.identity.service.StatusTypeService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * Generic StatusType record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/status-types")
public class StatusTypeController {
    private final StatusTypeService service;
    public StatusTypeController(StatusTypeService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'status_types', 'READ')")
    public PageResponse<StatusTypeResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'status_types', 'READ')")
    public StatusTypeResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'status_types', 'WRITE')")
    public StatusTypeResponse create(@Valid @RequestBody CreateStatusTypeRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'status_types', 'WRITE')")
    public StatusTypeResponse update(@PathVariable Long id, @RequestBody UpdateStatusTypeRequest request) { return service.update(id, request); }
}
