package com.dgt.backend.productstoreprices.controller;

import com.dgt.backend.productstoreprices.dto.PriceGroupResponse;
import com.dgt.backend.productstoreprices.dto.CreatePriceGroupRequest;
import com.dgt.backend.productstoreprices.dto.UpdatePriceGroupRequest;
import com.dgt.backend.productstoreprices.service.PriceGroupService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/price-groups")
public class PriceGroupController {
    private final PriceGroupService service;
    public PriceGroupController(PriceGroupService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'price_groups', 'READ')")
    public PageResponse<PriceGroupResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'price_groups', 'READ')")
    public PriceGroupResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'price_groups', 'WRITE')")
    public PriceGroupResponse create(@Valid @RequestBody CreatePriceGroupRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'price_groups', 'WRITE')")
    public PriceGroupResponse update(@PathVariable Long id, @RequestBody UpdatePriceGroupRequest request) { return service.update(id, request); }
}
