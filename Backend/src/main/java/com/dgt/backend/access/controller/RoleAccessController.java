package com.dgt.backend.access.controller;
import java.util.*;
import org.springframework.web.bind.annotation.*;

import com.dgt.backend.access.dto.RolePermissionBatch;
import com.dgt.backend.access.dto.RolePermissionChange;
import com.dgt.backend.access.service.RoleAccessService;

/** HTTP routes only; RoleAccessService owns validation, authorization and transactions. */
@RestController
@RequestMapping("/api/v1/access/stores/{store}/role-permissions")
public class RoleAccessController {
    private final RoleAccessService service;
    public RoleAccessController(RoleAccessService service) { this.service = service; }

    @GetMapping
    public Object get(@PathVariable String store){
        return service.get(store);
    }

    @PutMapping("/batch")
    public Object saveBatch(@PathVariable String store,@RequestBody RolePermissionBatch batch){
        return service.saveBatch(store, batch);
    }

    @PutMapping
    public Object save(@PathVariable String store,@RequestBody RolePermissionChange c){
        return service.save(store, c);
    }
}
