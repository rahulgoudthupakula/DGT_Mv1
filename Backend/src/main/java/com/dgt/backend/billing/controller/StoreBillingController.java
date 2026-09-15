package com.dgt.backend.billing.controller;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import com.dgt.backend.billing.service.StoreBilling;
@RestController
@RequestMapping("/api/v1/access/stores/{store}/billing")
@ConditionalOnProperty(name="app.billing.enabled",havingValue="true")
public class StoreBillingController {
 private final StoreBilling billing;
 public StoreBillingController(StoreBilling billing){this.billing=billing;}
 @GetMapping public Object get(@PathVariable String store){return billing.read(store);}
 @PostMapping public Object change(@PathVariable String store,@RequestHeader("Idempotency-Key") UUID key,@RequestBody StoreBilling.Command body){return billing.change(store,body,key);}
}
