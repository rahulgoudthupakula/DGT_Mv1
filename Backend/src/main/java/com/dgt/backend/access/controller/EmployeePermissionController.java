package com.dgt.backend.access.controller;
import java.util.*;
import org.springframework.web.bind.annotation.*;

import com.dgt.backend.access.dto.EmployeePermissionRequest;
import com.dgt.backend.access.service.EmployeePermissionService;

/** HTTP routes only; EmployeePermissionService owns validation, authorization and transactions. */
@RestController
@RequestMapping("/api/v1/access/stores/{store}/employee-access/{id}/permissions")
public class EmployeePermissionController {
    private final EmployeePermissionService service;
    public EmployeePermissionController(EmployeePermissionService service) { this.service = service; }

    @GetMapping
    public Object get(@PathVariable String store,@PathVariable long id){
        return service.get(store, id);
    }

    @PutMapping
    public Object save(@PathVariable String store,@PathVariable long id,@RequestBody EmployeePermissionRequest in){
        return service.save(store, id, in);
    }
}
