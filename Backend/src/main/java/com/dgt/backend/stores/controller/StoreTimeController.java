package com.dgt.backend.stores.controller;

import java.time.LocalDate;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.stores.service.StoreTimeService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/stores/{id}/business-day")
// Expose business-day boundaries to callers with store-settings read access.
public class StoreTimeController {
    private final StoreTimeService service;
    public StoreTimeController(StoreTimeService service) { this.service=service; }
    // Accept a local date and delegate timezone resolution to StoreTimeService.
    @GetMapping
    @PreAuthorize("@scopedAccess.can(authentication,#id,'STORE_SETTINGS',false)")
    public StoreTimeService.BusinessDay get(@PathVariable String id,@RequestParam LocalDate date) { return service.businessDay(id,date); }
}
