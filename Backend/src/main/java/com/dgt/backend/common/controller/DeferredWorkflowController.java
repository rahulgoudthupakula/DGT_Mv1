package com.dgt.backend.common.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1")
public class DeferredWorkflowController {
    @PostMapping({"/inventory/adjustments","/billing-invoices/{id}/record-payment","/auth/change-password"})
    @PreAuthorize("@accessPolicy.check(authentication, 'workflow', 'WRITE')")
    public void unavailable(@RequestBody Map<String,Object> request) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,"This legacy workflow is disabled until its rules are aligned with the new schema. No data was changed.");
    }
}
