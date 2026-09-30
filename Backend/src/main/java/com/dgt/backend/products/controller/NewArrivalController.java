package com.dgt.backend.products.controller;

import com.dgt.backend.products.dto.NewArrivalResponse;
import com.dgt.backend.products.dto.CreateNewArrivalRequest;
import com.dgt.backend.products.dto.UpdateNewArrivalRequest;
import com.dgt.backend.products.service.NewArrivalService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/new-arrivals")
public class NewArrivalController {
    private final NewArrivalService service;
    public NewArrivalController(NewArrivalService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'new_arrivals', 'READ')")
    public PageResponse<NewArrivalResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'new_arrivals', 'READ')")
    public NewArrivalResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'new_arrivals', 'WRITE')")
    public NewArrivalResponse create(@Valid @RequestBody CreateNewArrivalRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'new_arrivals', 'WRITE')")
    public NewArrivalResponse update(@PathVariable Long id, @RequestBody UpdateNewArrivalRequest request) { return service.update(id, request); }
}
