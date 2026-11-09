package com.dgt.backend.access.controller;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import com.dgt.backend.access.dto.ApprovalPolicyRequest;
import com.dgt.backend.access.dto.CreateAccessUserRequest;
import com.dgt.backend.access.dto.LegacyPermissionRequest;
import com.dgt.backend.access.dto.RoleAssignmentRequest;
import com.dgt.backend.access.service.AccessService;

/** HTTP routes only; AccessService owns validation, authorization and transactions. */
@RestController
@RequestMapping("/api/v1/access")
public class AccessController {
    private final AccessService service;
    public AccessController(AccessService service) { this.service = service; }

    @GetMapping("/me")
    public Map<String,Object> me(){
        return service.me();
    }

    @GetMapping("/stores")
    public Object stores(){
        return service.stores();
    }

    @GetMapping("/stores/{store}/context")
    public Object context(@PathVariable String store){
        return service.context(store);
    }

    @GetMapping("/stores/{store}/permissions")
    public Object permissions(@PathVariable String store){
        return service.permissions(store);
    }

    @PutMapping("/stores/{store}/permissions")
    public Object save(@PathVariable String store,@RequestBody LegacyPermissionRequest p){
        return service.save(store, p);
    }

    @PutMapping("/stores/{store}/approval-policy")
    public Object policy(@PathVariable String store,@RequestBody ApprovalPolicyRequest p){
        return service.policy(store, p);
    }

    @PutMapping("/stores/{store}/roles")
    public Object assignment(@PathVariable String store,@RequestBody RoleAssignmentRequest a){
        return service.assignment(store, a);
    }

    @PostMapping("/stores/{store}/users") @ResponseStatus(HttpStatus.CREATED)
    public Object createUser(@PathVariable String store,@RequestBody CreateAccessUserRequest input){
        return service.createUser(store, input);
    }
}
