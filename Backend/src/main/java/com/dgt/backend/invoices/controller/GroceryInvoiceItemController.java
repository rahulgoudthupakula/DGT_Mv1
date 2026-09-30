package com.dgt.backend.invoices.controller;

import com.dgt.backend.invoices.dto.GroceryInvoiceItemResponse;
import com.dgt.backend.invoices.dto.CreateGroceryInvoiceItemRequest;
import com.dgt.backend.invoices.dto.UpdateGroceryInvoiceItemRequest;
import com.dgt.backend.invoices.service.GroceryInvoiceItemService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/grocery-invoice-items")
public class GroceryInvoiceItemController {
    private final GroceryInvoiceItemService service;
    public GroceryInvoiceItemController(GroceryInvoiceItemService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'grocery_invoice_items', 'READ')")
    public PageResponse<GroceryInvoiceItemResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'grocery_invoice_items', 'READ')")
    public GroceryInvoiceItemResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'grocery_invoice_items', 'WRITE')")
    public GroceryInvoiceItemResponse create(@Valid @RequestBody CreateGroceryInvoiceItemRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'grocery_invoice_items', 'WRITE')")
    public GroceryInvoiceItemResponse update(@PathVariable Long id, @RequestBody UpdateGroceryInvoiceItemRequest request) { return service.update(id, request); }
}
