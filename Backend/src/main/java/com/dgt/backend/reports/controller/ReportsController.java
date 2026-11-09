package com.dgt.backend.reports.controller;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.reports.entity.*;
import com.dgt.backend.reports.service.ReportsService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/reports")
@PreAuthorize("@accessPolicy.check(authentication, 'reports', 'READ')")
// Generic reporting API guarded by AccessPolicy, separate from the store-scoped dashboard routes.
public class ReportsController {
    private final ReportsService service;
    public ReportsController(ReportsService service) { this.service=service; }
    // Read daily sales summaries for the supplied timestamp interval.
    @GetMapping("/sales") public List<SalesSummary> sales(@RequestParam String storeId,@RequestParam OffsetDateTime from,@RequestParam OffsetDateTime to) { return service.sales(storeId,from,to); }
    // Read a zero-based inventory page, defaulting to 50 rows.
    @GetMapping("/inventory") public List<InventorySnapshot> inventory(@RequestParam String dgtId,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size) { return service.inventory(dgtId,page,size); }
}
