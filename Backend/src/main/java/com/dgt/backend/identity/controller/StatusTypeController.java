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

@RestController
@RequestMapping("/api/v1/status-types")
public class StatusTypeController {
    private final StatusTypeService service;
    public StatusTypeController(StatusTypeService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'status_types', 'READ')")
    public PageResponse<StatusTypeResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'status_types', 'READ')")
    public StatusTypeResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'status_types', 'WRITE')")
    public StatusTypeResponse create(@Valid @RequestBody CreateStatusTypeRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'status_types', 'WRITE')")
    public StatusTypeResponse update(@PathVariable Long id, @RequestBody UpdateStatusTypeRequest request) { return service.update(id, request); }
}
