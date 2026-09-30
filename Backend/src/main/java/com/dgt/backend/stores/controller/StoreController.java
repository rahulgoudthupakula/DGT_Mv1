package com.dgt.backend.stores.controller;

import com.dgt.backend.stores.dto.StoreResponse;
import com.dgt.backend.stores.dto.CreateStoreRequest;
import com.dgt.backend.stores.dto.UpdateStoreRequest;
import com.dgt.backend.stores.service.StoreService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stores")
public class StoreController {
    private final StoreService service;
    public StoreController(StoreService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'stores', 'READ')")
    public PageResponse<StoreResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'stores', 'READ')")
    public StoreResponse get(@PathVariable String id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'stores', 'WRITE')")
    public StoreResponse create(@Valid @RequestBody CreateStoreRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'stores', 'WRITE')")
    public StoreResponse update(@PathVariable String id, @RequestBody UpdateStoreRequest request) { return service.update(id, request); }
}
