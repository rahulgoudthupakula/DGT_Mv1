package com.dgt.backend.fuel.controller;

import com.dgt.backend.fuel.dto.FuelTankResponse;
import com.dgt.backend.fuel.dto.CreateFuelTankRequest;
import com.dgt.backend.fuel.dto.UpdateFuelTankRequest;
import com.dgt.backend.fuel.service.FuelTankService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/fuel-tanks")
public class FuelTankController {
    private final FuelTankService service;
    public FuelTankController(FuelTankService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_tanks', 'READ')")
    public PageResponse<FuelTankResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_tanks', 'READ')")
    public FuelTankResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_tanks', 'WRITE')")
    public FuelTankResponse create(@Valid @RequestBody CreateFuelTankRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_tanks', 'WRITE')")
    public FuelTankResponse update(@PathVariable Long id, @RequestBody UpdateFuelTankRequest request) { return service.update(id, request); }
}
