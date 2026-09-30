package com.dgt.backend.sales.controller;

import com.dgt.backend.sales.dto.TenderTypeResponse;
import com.dgt.backend.sales.dto.CreateTenderTypeRequest;
import com.dgt.backend.sales.dto.UpdateTenderTypeRequest;
import com.dgt.backend.sales.service.TenderTypeService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tender-types")
public class TenderTypeController {
    private final TenderTypeService service;
    public TenderTypeController(TenderTypeService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'tender_types', 'READ')")
    public PageResponse<TenderTypeResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'tender_types', 'READ')")
    public TenderTypeResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'tender_types', 'WRITE')")
    public TenderTypeResponse create(@Valid @RequestBody CreateTenderTypeRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'tender_types', 'WRITE')")
    public TenderTypeResponse update(@PathVariable Long id, @RequestBody UpdateTenderTypeRequest request) { return service.update(id, request); }
}
