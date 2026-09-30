package com.dgt.backend.invoices.service;

import com.dgt.backend.invoices.dto.GroceryInvoiceItemResponse;
import com.dgt.backend.invoices.dto.CreateGroceryInvoiceItemRequest;
import com.dgt.backend.invoices.dto.UpdateGroceryInvoiceItemRequest;
import com.dgt.backend.invoices.entity.GroceryInvoiceItem;
import com.dgt.backend.invoices.repository.GroceryInvoiceItemRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class GroceryInvoiceItemService {
    private final GroceryInvoiceItemRepository repository;
    public GroceryInvoiceItemService(GroceryInvoiceItemRepository repository) { this.repository = repository; }

    public PageResponse<GroceryInvoiceItemResponse> list(int page, int size) {
        log.debug("Listing grocery invoice item page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("groceryInvoiceItemId")));
        log.debug("GroceryInvoiceItem list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(GroceryInvoiceItemResponse::from).toList(), page, size, p.getTotalElements());
    }

    public GroceryInvoiceItemResponse get(Long id) {
        log.debug("Fetching grocery invoice item id={}", id);
        return GroceryInvoiceItemResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("GroceryInvoiceItem not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public GroceryInvoiceItemResponse create(CreateGroceryInvoiceItemRequest req) {
        log.info("Creating grocery invoice item");
        var entity = GroceryInvoiceItem.builder()
                .invoiceId(req.invoiceId())
                .productId(req.productId())
                .vendorItemCode(req.vendorItemCode())
                .quantity(req.quantity())
                .unitType(req.unitType())
                .casePackQuantity(req.casePackQuantity())
                .msrp(req.msrp())
                .unitCost(req.unitCost())
                .itemLineDiscount(req.itemLineDiscount())
                .itemLineTotal(req.itemLineTotal())
                .isProductNew(req.isProductNew())
                .build();
        var saved = repository.save(entity);
        log.info("Created grocery invoice item id={}", saved.getGroceryInvoiceItemId());
        return GroceryInvoiceItemResponse.from(saved);
    }

    @Transactional
    public GroceryInvoiceItemResponse update(Long id, UpdateGroceryInvoiceItemRequest req) {
        log.info("Updating grocery invoice item id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("GroceryInvoiceItem not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.invoiceId() != null) entity.setInvoiceId(req.invoiceId());
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.vendorItemCode() != null) entity.setVendorItemCode(req.vendorItemCode());
        if (req.quantity() != null) entity.setQuantity(req.quantity());
        if (req.unitType() != null) entity.setUnitType(req.unitType());
        if (req.casePackQuantity() != null) entity.setCasePackQuantity(req.casePackQuantity());
        if (req.msrp() != null) entity.setMsrp(req.msrp());
        if (req.unitCost() != null) entity.setUnitCost(req.unitCost());
        if (req.itemLineDiscount() != null) entity.setItemLineDiscount(req.itemLineDiscount());
        if (req.itemLineTotal() != null) entity.setItemLineTotal(req.itemLineTotal());
        if (req.isProductNew() != null) entity.setIsProductNew(req.isProductNew());
        var saved = repository.save(entity);
        log.info("Updated grocery invoice item id={}", id);
        return GroceryInvoiceItemResponse.from(saved);
    }
}
