package com.dgt.backend.access;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/v1/access/stores/{store}/approvals")
public class ApprovalController {
 private final ApprovalService service;
 public ApprovalController(ApprovalService service){this.service=service;}
 @GetMapping public Object list(@PathVariable String store){return service.list(store);}
 public record Decision(String decision,String note){}
 @PostMapping("/{id}/decision") public Object decide(@PathVariable String store,@PathVariable long id,@RequestBody Decision body){return service.decide(store,id,body.decision(),body.note());}
}
