package com.dgt.backend.stores.controller;

import java.time.LocalDate;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.stores.service.StoreTimeService;

@RestController
@RequestMapping("/api/v1/stores/{id}/business-day")
public class StoreTimeController {
    private final StoreTimeService service;
    public StoreTimeController(StoreTimeService service) { this.service=service; }
    @GetMapping
    @PreAuthorize("@scopedAccess.can(authentication,#id,'STORE_SETTINGS',false)")
    public StoreTimeService.BusinessDay get(@PathVariable String id,@RequestParam LocalDate date) { return service.businessDay(id,date); }
}
