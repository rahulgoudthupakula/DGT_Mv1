package com.dgt.backend.sales.controller;

import com.dgt.backend.sales.dto.PosTerminalResponse;
import com.dgt.backend.sales.dto.CreatePosTerminalRequest;
import com.dgt.backend.sales.dto.UpdatePosTerminalRequest;
import com.dgt.backend.sales.service.PosTerminalService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/pos-terminals")
// Generic POS terminal API guarded by AccessPolicy; this is separate from the store-scoped pricebook endpoints.
public class PosTerminalController {
    private final PosTerminalService service;
    public PosTerminalController(PosTerminalService service) { this.service = service; }

    // Read a zero-based page; defaults are page 0 and 50 records.
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'pos_terminals', 'READ')")
    public PageResponse<PosTerminalResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    // Read one record by its database identifier.
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'pos_terminals', 'READ')")
    public PosTerminalResponse get(@PathVariable Long id) { return service.get(id); }

    // Validate the create DTO and return HTTP 201 after the service saves it.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'pos_terminals', 'WRITE')")
    public PosTerminalResponse create(@Valid @RequestBody CreatePosTerminalRequest request) { return service.create(request); }

    // Apply non-null request fields; this endpoint does not declare @Valid on its update body.
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'pos_terminals', 'WRITE')")
    public PosTerminalResponse update(@PathVariable Long id, @RequestBody UpdatePosTerminalRequest request) { return service.update(id, request); }
}
