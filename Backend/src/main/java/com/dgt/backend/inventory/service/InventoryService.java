package com.dgt.backend.inventory.service;

import com.dgt.backend.inventory.dto.CreateInventoryRequest;
import com.dgt.backend.inventory.dto.InventoryResponse;
import com.dgt.backend.inventory.dto.UpdateInventoryRequest;
import com.dgt.backend.inventory.entity.Inventory;
import com.dgt.backend.inventory.repository.InventoryRepository;
import com.dgt.backend.common.dto.PageResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * JPA CRUD operations for Inventory.
 * The caller is responsible for authorization and workflow validation; these queries add no store predicate.
 */

@Slf4j
@Service
public class InventoryService {
    private final InventoryRepository repository;
    public InventoryService(InventoryRepository repository) { this.repository = repository; }

    /** Load a page sorted by primary key and map its records to response DTOs. */
    public PageResponse<InventoryResponse> list(int page, int size) {
        log.debug("Listing inventory page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("inventoryId")));
        log.debug("Inventory list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(InventoryResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load a record by ID or return HTTP 404. */
    public InventoryResponse get(Long id) {
        log.debug("Fetching inventory id={}", id);
        return InventoryResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Inventory not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
    @Transactional
    public InventoryResponse create(CreateInventoryRequest req) {
        log.info("Creating inventory dgtId={}", req.dgtId());
        // Copy the supplied stock balance; this method does not create a matching movement record.
        var entity = Inventory.builder()
                .dgtId(req.dgtId())
                .productId(req.productId())
                .availableQuantity(req.availableQuantity())
                .cost(req.cost())
                .returnCost(req.returnCost())
                .build();
        var saved = repository.save(entity);
        log.info("Created inventory id={}", saved.getInventoryId());
        return InventoryResponse.from(saved);
    }

    /** Apply only non-null fields in one transaction, leaving omitted fields unchanged. */
    @Transactional
    public InventoryResponse update(Long id, UpdateInventoryRequest req) {
        log.info("Updating inventory id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Inventory not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.productId() != null) entity.setProductId(req.productId());
        // The submitted quantity replaces the stored balance rather than adding a delta.
        if (req.availableQuantity() != null) entity.setAvailableQuantity(req.availableQuantity());
        if (req.cost() != null) entity.setCost(req.cost());
        if (req.returnCost() != null) entity.setReturnCost(req.returnCost());
        var saved = repository.save(entity);
        log.info("Updated inventory id={}", id);
        return InventoryResponse.from(saved);
    }
}
