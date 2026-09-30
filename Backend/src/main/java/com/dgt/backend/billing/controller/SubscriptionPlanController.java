package com.dgt.backend.billing.controller;

import com.dgt.backend.billing.dto.SubscriptionPlanResponse;
import com.dgt.backend.billing.dto.CreateSubscriptionPlanRequest;
import com.dgt.backend.billing.dto.UpdateSubscriptionPlanRequest;
import com.dgt.backend.billing.service.SubscriptionPlanService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/subscription-plans")
public class SubscriptionPlanController {
    private final SubscriptionPlanService service;
    public SubscriptionPlanController(SubscriptionPlanService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'subscription_plans', 'READ')")
    public PageResponse<SubscriptionPlanResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return service.list(page, size);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'subscription_plans', 'READ')")
    public SubscriptionPlanResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'subscription_plans', 'WRITE')")
    public SubscriptionPlanResponse create(@Valid @RequestBody CreateSubscriptionPlanRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'subscription_plans', 'WRITE')")
    public SubscriptionPlanResponse update(@PathVariable Long id, @RequestBody UpdateSubscriptionPlanRequest request) { return service.update(id, request); }
}
