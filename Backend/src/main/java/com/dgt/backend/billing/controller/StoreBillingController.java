package com.dgt.backend.billing.controller;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import com.dgt.backend.billing.service.StoreBilling;
import lombok.extern.slf4j.Slf4j;

/**
 * Store-scoped billing page API, enabled by app.billing.enabled.
 * The service enforces store-admin access and performs subscription lifecycle changes.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/access/stores/{store}/billing")
@ConditionalOnProperty(name="app.billing.enabled",havingValue="true")
public class StoreBillingController {
 private final StoreBilling billing;
 public StoreBillingController(StoreBilling billing){this.billing=billing;}
 /** Load the subscription, add-on catalog, plans, and invoices for this store. */
 @GetMapping public Object get(@PathVariable String store){return billing.read(store);}
 /** Submit a version-checked billing command with a UUID key for safe retries. */
 @PostMapping public Object change(@PathVariable String store,@RequestHeader("Idempotency-Key") UUID key,@RequestBody StoreBilling.Command body){return billing.change(store,body,key);}
}
