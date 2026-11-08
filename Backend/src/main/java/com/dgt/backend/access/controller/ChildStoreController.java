package com.dgt.backend.access.controller;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import com.dgt.backend.access.dto.CreateChildStoreRequest;
import com.dgt.backend.access.service.ChildStoreService;

/** HTTP routes only; ChildStoreService owns validation, authorization and transactions. */
@RestController
@RequestMapping("/api/v1/access/stores/{store}/manage-stores")
public class ChildStoreController {
    private final ChildStoreService service;
    public ChildStoreController(ChildStoreService service) { this.service = service; }

    @GetMapping
    public Object list(@PathVariable String store){
        return service.list(store);
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public Object create(@PathVariable String store,@RequestHeader("Idempotency-Key") UUID key,@RequestBody CreateChildStoreRequest raw){
        return service.create(store, key, raw);
    }
}
