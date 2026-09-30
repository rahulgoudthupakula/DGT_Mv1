package com.dgt.backend.fuel.controller;

import com.dgt.backend.fuel.dto.FuelPriceResponse;
import com.dgt.backend.fuel.dto.CreateFuelPriceRequest;
import com.dgt.backend.fuel.dto.UpdateFuelPriceRequest;
import com.dgt.backend.fuel.service.FuelPriceService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/fuel-prices")
public class FuelPriceController {
    private final FuelPriceService service;
    public FuelPriceController(FuelPriceService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_prices', 'READ')")
    public PageResponse<FuelPriceResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_prices', 'READ')")
    public FuelPriceResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_prices', 'WRITE')")
    public FuelPriceResponse create(@Valid @RequestBody CreateFuelPriceRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_prices', 'WRITE')")
    public FuelPriceResponse update(@PathVariable Long id, @RequestBody UpdateFuelPriceRequest request) { return service.update(id, request); }
}
