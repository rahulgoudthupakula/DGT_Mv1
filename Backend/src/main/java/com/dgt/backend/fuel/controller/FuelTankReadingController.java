package com.dgt.backend.fuel.controller;

import com.dgt.backend.fuel.dto.FuelTankReadingResponse;
import com.dgt.backend.fuel.dto.CreateFuelTankReadingRequest;
import com.dgt.backend.fuel.dto.UpdateFuelTankReadingRequest;
import com.dgt.backend.fuel.service.FuelTankReadingService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * Generic FuelTankReading record API, currently denied by AccessPolicy.
 * Store-specific workflows perform their own authorization separately.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/fuel-tank-readings")
public class FuelTankReadingController {
    private final FuelTankReadingService service;
    public FuelTankReadingController(FuelTankReadingService service) { this.service = service; }

    /** List a zero-based page after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_tank_readings', 'READ')")
    public PageResponse<FuelTankReadingResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    /** Fetch one record by its database ID; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_tank_readings', 'READ')")
    public FuelTankReadingResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the creation payload and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_tank_readings', 'WRITE')")
    public FuelTankReadingResponse create(@Valid @RequestBody CreateFuelTankReadingRequest request) { return service.create(request); }

    /** Apply non-null update fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_tank_readings', 'WRITE')")
    public FuelTankReadingResponse update(@PathVariable Long id, @RequestBody UpdateFuelTankReadingRequest request) { return service.update(id, request); }
}
