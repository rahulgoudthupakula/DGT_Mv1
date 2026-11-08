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
import lombok.extern.slf4j.Slf4j;

/**
 * Generic StoreSubscription record API, gated by AccessPolicy.
 * Delegates CRUD operations to the service; subscription lifecycle commands use StoreBillingController.
 */

@Slf4j
@RestController
@RequestMapping("/api/v1/store-subscriptions")
public class StoreSubscriptionController {
    private final StoreSubscriptionService service;
    public StoreSubscriptionController(StoreSubscriptionService service) { this.service = service; }

    /** Return a zero-based page of records after the access-policy check. */
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'store_subscriptions', 'READ')")
    public PageResponse<StoreSubscriptionResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return service.list(page, size);
    }

    /** Fetch one record by its database identifier; missing records return 404. */
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_subscriptions', 'READ')")
    public StoreSubscriptionResponse get(@PathVariable Long id) { return service.get(id); }

    /** Validate the create request and return the saved record with HTTP 201. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'store_subscriptions', 'WRITE')")
    public StoreSubscriptionResponse create(@Valid @RequestBody CreateStoreSubscriptionRequest request) { return service.create(request); }

    /** Apply supplied non-null fields to an existing record. */
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'store_subscriptions', 'WRITE')")
    public StoreSubscriptionResponse update(@PathVariable Long id, @RequestBody UpdateStoreSubscriptionRequest request) { return service.update(id, request); }
}
