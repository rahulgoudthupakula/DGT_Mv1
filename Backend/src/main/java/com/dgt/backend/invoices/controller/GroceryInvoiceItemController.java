package com.dgt.backend.invoices.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dgt.backend.invoices.service.GroceryInvoiceItemService;
import com.dgt.backend.invoices.entity.GroceryInvoiceItem;
@RestController
@RequestMapping("/api/v1/grocery-invoice-items")
public class GroceryInvoiceItemController {
    private final GroceryInvoiceItemService service;
    public GroceryInvoiceItemController(GroceryInvoiceItemService service) { this.service=service; }
    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'grocery_invoice_items', 'READ')")
    public Map<String,Object> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size) { return service.list(page,size); }
    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'grocery_invoice_items', 'READ')")
    public GroceryInvoiceItem get(@PathVariable Long id) { return service.get(id); }
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'grocery_invoice_items', 'WRITE')")
    public Map<String,Object> create(@RequestBody Map<String,Object> values) { return service.create(values); }
    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'grocery_invoice_items', 'WRITE')")
    public Map<String,Object> update(@PathVariable Long id,@RequestHeader("If-Match") String expected,@RequestBody Map<String,Object> values) { return service.update(id,values,expected); }
}
