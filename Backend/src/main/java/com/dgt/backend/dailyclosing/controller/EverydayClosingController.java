package com.dgt.backend.dailyclosing.controller;

import com.dgt.backend.dailyclosing.dto.EverydayClosingResponse;
import com.dgt.backend.dailyclosing.dto.CreateEverydayClosingRequest;
import com.dgt.backend.dailyclosing.dto.UpdateEverydayClosingRequest;
import com.dgt.backend.dailyclosing.service.EverydayClosingService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * Generic EverydayClosing CRUD API. AccessPolicy currently denies these routes.
 * The connected daily closing page uses StoreClosingController instead.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/everyday-closings")
public class EverydayClosingController {
    private final EverydayClosingService service;
    public EverydayClosingController(EverydayClosingService service) { this.service = service; }

    /** List a zero-based page after the generic access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'everyday_closing', 'READ')")
    public PageResponse<EverydayClosingResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Retrieve one record by primary key; an unknown identifier returns 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'everyday_closing', 'READ')")
    public EverydayClosingResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'everyday_closing', 'WRITE')")
    public EverydayClosingResponse create(@Valid @RequestBody CreateEverydayClosingRequest request) { return service.create(request); }

    /** Apply non-null request fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'everyday_closing', 'WRITE')")
    public EverydayClosingResponse update(@PathVariable Long id, @RequestBody UpdateEverydayClosingRequest request) { return service.update(id, request); }
}
