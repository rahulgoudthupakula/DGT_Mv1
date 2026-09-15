package com.dgt.backend.vendors.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.vendors.service.VendorService;
import com.dgt.backend.vendors.entity.Vendor;
@RestController
@RequestMapping("/api/v1/vendors")
public class VendorController {
    private final VendorService service;
    public VendorController(VendorService service) { this.service=service; }
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'vendors', 'READ')")
    public Map<String,Object> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size) { return service.list(page,size); }
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'vendors', 'READ')")
    public Vendor get(@PathVariable Long id) { return service.get(id); }
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'vendors', 'WRITE')")
    public Map<String,Object> create(@RequestBody Map<String,Object> values) { return service.create(values); }
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'vendors', 'WRITE')")
    public Map<String,Object> update(@PathVariable Long id,@RequestHeader("If-Match") String expected,@RequestBody Map<String,Object> values) { return service.update(id,values,expected); }
}
