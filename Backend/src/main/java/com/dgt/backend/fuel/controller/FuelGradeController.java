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

@RestController
@RequestMapping("/api/v1/fuel-grades")
public class FuelGradeController {
    private final FuelGradeService service;
    public FuelGradeController(FuelGradeService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_grades', 'READ')")
    public PageResponse<FuelGradeResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_grades', 'READ')")
    public FuelGradeResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_grades', 'WRITE')")
    public FuelGradeResponse create(@Valid @RequestBody CreateFuelGradeRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'fuel_grades', 'WRITE')")
    public FuelGradeResponse update(@PathVariable Long id, @RequestBody UpdateFuelGradeRequest request) { return service.update(id, request); }
}
