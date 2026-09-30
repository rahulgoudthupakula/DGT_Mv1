package com.dgt.backend.fuel.controller;

import com.dgt.backend.fuel.dto.FuelPumpResponse;
import com.dgt.backend.fuel.dto.CreateFuelPumpRequest;
import com.dgt.backend.fuel.dto.UpdateFuelPumpRequest;
import com.dgt.backend.fuel.service.FuelPumpService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/fuel-pumps")
public class FuelPumpController {
    private final FuelPumpService service;
    public FuelPumpController(FuelPumpService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_pumps', 'READ')")
    public PageResponse<FuelPumpResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_pumps', 'READ')")
    public FuelPumpResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_pumps', 'WRITE')")
    public FuelPumpResponse create(@Valid @RequestBody CreateFuelPumpRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_pumps', 'WRITE')")
    public FuelPumpResponse update(@PathVariable Long id, @RequestBody UpdateFuelPumpRequest request) { return service.update(id, request); }
}
