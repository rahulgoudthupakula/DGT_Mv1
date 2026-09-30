package com.dgt.backend.stores.controller;

import com.dgt.backend.stores.dto.StoreBusinessHourResponse;
import com.dgt.backend.stores.dto.CreateStoreBusinessHourRequest;
import com.dgt.backend.stores.dto.UpdateStoreBusinessHourRequest;
import com.dgt.backend.stores.service.StoreBusinessHourService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/store-business-hours")
public class StoreBusinessHourController {
    private final StoreBusinessHourService service;
    public StoreBusinessHourController(StoreBusinessHourService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'store_business_hours', 'READ')")
    public PageResponse<StoreBusinessHourResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_business_hours', 'READ')")
    public StoreBusinessHourResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'store_business_hours', 'WRITE')")
    public StoreBusinessHourResponse create(@Valid @RequestBody CreateStoreBusinessHourRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_business_hours', 'WRITE')")
    public StoreBusinessHourResponse update(@PathVariable Long id, @RequestBody UpdateStoreBusinessHourRequest request) { return service.update(id, request); }
}
