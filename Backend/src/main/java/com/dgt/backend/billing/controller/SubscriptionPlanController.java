package com.dgt.backend.billing.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.billing.service.SubscriptionPlanService;
import com.dgt.backend.billing.entity.SubscriptionPlan;
@RestController
@RequestMapping("/api/v1/subscription-plans")
public class SubscriptionPlanController {
    private final SubscriptionPlanService service;
    public SubscriptionPlanController(SubscriptionPlanService service) { this.service=service; }
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'subscription_plans', 'READ')")
    public Map<String,Object> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size) { return service.list(page,size); }
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'subscription_plans', 'READ')")
    public SubscriptionPlan get(@PathVariable Long id) { return service.get(id); }
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'subscription_plans', 'WRITE')")
    public Map<String,Object> create(@RequestBody Map<String,Object> values) { return service.create(values); }
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'subscription_plans', 'WRITE')")
    public Map<String,Object> update(@PathVariable Long id,@RequestHeader("If-Match") String expected,@RequestBody Map<String,Object> values) { return service.update(id,values,expected); }
}
