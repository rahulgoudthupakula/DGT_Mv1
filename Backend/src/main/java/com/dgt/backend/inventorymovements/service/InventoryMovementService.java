package com.dgt.backend.inventorymovements.service;

import com.dgt.backend.inventorymovements.dto.InventoryMovementResponse;
import com.dgt.backend.inventorymovements.dto.CreateInventoryMovementRequest;
import com.dgt.backend.inventorymovements.dto.UpdateInventoryMovementRequest;
import com.dgt.backend.inventorymovements.entity.InventoryMovement;
import com.dgt.backend.inventorymovements.repository.InventoryMovementRepository;
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
public class InventoryMovementService {
    private final InventoryMovementRepository repository;
    public InventoryMovementService(InventoryMovementRepository repository) { this.repository = repository; }

    public PageResponse<InventoryMovementResponse> list(int page, int size) {
        log.debug("Listing inventory movement page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("movementId")));
        log.debug("InventoryMovement list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(InventoryMovementResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InventoryMovementResponse get(Long id) {
        log.debug("Fetching inventory movement id={}", id);
        return InventoryMovementResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InventoryMovement not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public InventoryMovementResponse create(CreateInventoryMovementRequest req) {
        log.info("Creating inventory movement");
        var entity = InventoryMovement.builder()
                .dgtId(req.dgtId())
                .productId(req.productId())
                .movementType(req.movementType())
                .qtyChanged(req.qtyChanged())
                .unitCost(req.unitCost())
                .referenceId(req.referenceId())
                .build();
        var saved = repository.save(entity);
        log.info("Created inventory movement id={}", saved.getInventoryMovementId());
        return InventoryMovementResponse.from(saved);
    }

    @Transactional
    public InventoryMovementResponse update(Long id, UpdateInventoryMovementRequest req) {
        log.info("Updating inventory movement id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InventoryMovement not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.movementType() != null) entity.setMovementType(req.movementType());
        if (req.qtyChanged() != null) entity.setQtyChanged(req.qtyChanged());
        if (req.unitCost() != null) entity.setUnitCost(req.unitCost());
        if (req.referenceId() != null) entity.setReferenceId(req.referenceId());
        var saved = repository.save(entity);
        log.info("Updated inventory movement id={}", id);
        return InventoryMovementResponse.from(saved);
    }
}
