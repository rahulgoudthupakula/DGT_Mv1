package com.dgt.backend.billing.controller;

import com.dgt.backend.billing.dto.StoreSubscriptionResponse;
import com.dgt.backend.billing.dto.CreateStoreSubscriptionRequest;
import com.dgt.backend.billing.dto.UpdateStoreSubscriptionRequest;
import com.dgt.backend.billing.service.StoreSubscriptionService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/store-subscriptions")
public class StoreSubscriptionController {
    private final StoreSubscriptionService service;
    public StoreSubscriptionController(StoreSubscriptionService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'store_subscriptions', 'READ')")
    public PageResponse<StoreSubscriptionResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return service.list(page, size);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_subscriptions', 'READ')")
    public StoreSubscriptionResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'store_subscriptions', 'WRITE')")
    public StoreSubscriptionResponse create(@Valid @RequestBody CreateStoreSubscriptionRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_subscriptions', 'WRITE')")
    public StoreSubscriptionResponse update(@PathVariable Long id, @RequestBody UpdateStoreSubscriptionRequest request) { return service.update(id, request); }
}
