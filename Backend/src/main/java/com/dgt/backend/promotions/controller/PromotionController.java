package com.dgt.backend.promotions.controller;

import com.dgt.backend.promotions.dto.PromotionResponse;
import com.dgt.backend.promotions.dto.CreatePromotionRequest;
import com.dgt.backend.promotions.dto.UpdatePromotionRequest;
import com.dgt.backend.promotions.service.PromotionService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/promotions")
public class PromotionController {
    private final PromotionService service;
    public PromotionController(PromotionService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'promotions', 'READ')")
    public PageResponse<PromotionResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'promotions', 'READ')")
    public PromotionResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'promotions', 'WRITE')")
    public PromotionResponse create(@Valid @RequestBody CreatePromotionRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'promotions', 'WRITE')")
    public PromotionResponse update(@PathVariable Long id, @RequestBody UpdatePromotionRequest request) { return service.update(id, request); }
}
