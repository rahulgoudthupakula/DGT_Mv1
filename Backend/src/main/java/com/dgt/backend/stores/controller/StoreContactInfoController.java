package com.dgt.backend.stores.controller;

import com.dgt.backend.stores.dto.StoreContactInfoResponse;
import com.dgt.backend.stores.dto.CreateStoreContactInfoRequest;
import com.dgt.backend.stores.dto.UpdateStoreContactInfoRequest;
import com.dgt.backend.stores.service.StoreContactInfoService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/store-contact-info")
public class StoreContactInfoController {
    private final StoreContactInfoService service;
    public StoreContactInfoController(StoreContactInfoService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'store_contact_info', 'READ')")
    public PageResponse<StoreContactInfoResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_contact_info', 'READ')")
    public StoreContactInfoResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'store_contact_info', 'WRITE')")
    public StoreContactInfoResponse create(@Valid @RequestBody CreateStoreContactInfoRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_contact_info', 'WRITE')")
    public StoreContactInfoResponse update(@PathVariable Long id, @RequestBody UpdateStoreContactInfoRequest request) { return service.update(id, request); }
}
