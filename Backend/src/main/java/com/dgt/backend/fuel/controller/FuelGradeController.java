package com.dgt.backend.fuel.controller;

import com.dgt.backend.fuel.dto.FuelGradeResponse;
import com.dgt.backend.fuel.dto.CreateFuelGradeRequest;
import com.dgt.backend.fuel.dto.UpdateFuelGradeRequest;
import com.dgt.backend.fuel.service.FuelGradeService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * Generic FuelGrade record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/fuel-grades")
public class FuelGradeController {
    private final FuelGradeService service;
    public FuelGradeController(FuelGradeService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_grades', 'READ')")
    public PageResponse<FuelGradeResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_grades', 'READ')")
    public FuelGradeResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_grades', 'WRITE')")
    public FuelGradeResponse create(@Valid @RequestBody CreateFuelGradeRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_grades', 'WRITE')")
    public FuelGradeResponse update(@PathVariable Long id, @RequestBody UpdateFuelGradeRequest request) { return service.update(id, request); }
}
