package com.dgt.backend.access.controller;

import com.dgt.backend.access.service.ApprovalService;
import com.dgt.backend.access.dto.ApprovalDecisionRequest;
import org.springframework.web.bind.annotation.*;

/**
 * HTTP adapter for store approval lists and decisions. ApprovalService owns reviewer
 * authorization, request state transitions and applying approved changes.
 */
@RestController
@RequestMapping("/api/v1/access/stores/{store}/approvals")
public class ApprovalController {
 private final ApprovalService service;
 public ApprovalController(ApprovalService service){this.service=service;}
 // List only requests the service allows the caller to see.
 @GetMapping public Object list(@PathVariable String store){return service.list(store);}

 // Send APPROVED, REJECTED or CANCELLED to the service; the URL ID alone grants no review
 // authority.
 @PostMapping("/{id}/decision") public Object decide(@PathVariable String store,@PathVariable long id,@RequestBody ApprovalDecisionRequest body){return service.decide(store,id,body.decision(),body.note());}
}
