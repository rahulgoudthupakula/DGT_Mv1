package com.dgt.backend.inventory.service;

import com.dgt.backend.inventory.dto.InventoryReturnItemResponse;
import com.dgt.backend.inventory.dto.CreateInventoryReturnItemRequest;
import com.dgt.backend.inventory.dto.UpdateInventoryReturnItemRequest;
import com.dgt.backend.inventory.entity.InventoryReturnItem;
import com.dgt.backend.inventory.repository.InventoryReturnItemRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA CRUD operations for InventoryReturnItem.
 * The caller is responsible for authorization and workflow validation; these queries add no store predicate.
 */

@Slf4j
@Service
public class InventoryReturnItemService {
    private final InventoryReturnItemRepository repository;
    public InventoryReturnItemService(InventoryReturnItemRepository repository) { this.repository = repository; }

    /** Load a page sorted by primary key and map its records to response DTOs. */
    public PageResponse<InventoryReturnItemResponse> list(int page, int size) {
        log.debug("Listing inventory return item page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("returnItemId")));
        log.debug("InventoryReturnItem list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(InventoryReturnItemResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load a record by ID or return HTTP 404. */
    public InventoryReturnItemResponse get(Long id) {
        log.debug("Fetching inventory return item id={}", id);
        return InventoryReturnItemResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InventoryReturnItem not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
    @Transactional
    public InventoryReturnItemResponse create(CreateInventoryReturnItemRequest req) {
        log.info("Creating inventory return item");
        // Save the return line values without calculating a stock adjustment in this service.
        var entity = InventoryReturnItem.builder()
                .returnId(req.returnId())
                .productId(req.productId())
                .qty(req.qty())
                .unitCost(req.unitCost())
                .reason(req.reason())
                .build();
        var saved = repository.save(entity);
        log.info("Created inventory return item id={}", saved.getReturnItemId());
        return InventoryReturnItemResponse.from(saved);
    }

    /** Apply only non-null fields in one transaction, leaving omitted fields unchanged. */
    @Transactional
    public InventoryReturnItemResponse update(Long id, UpdateInventoryReturnItemRequest req) {
        log.info("Updating inventory return item id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InventoryReturnItem not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.returnId() != null) entity.setReturnId(req.returnId());
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.qty() != null) entity.setQty(req.qty());
        if (req.unitCost() != null) entity.setUnitCost(req.unitCost());
        if (req.reason() != null) entity.setReason(req.reason());
        var saved = repository.save(entity);
        log.info("Updated inventory return item id={}", id);
        return InventoryReturnItemResponse.from(saved);
    }
}
