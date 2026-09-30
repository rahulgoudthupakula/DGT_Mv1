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

@Service
public class InventoryMovementService {
    private final InventoryMovementRepository repository;
    public InventoryMovementService(InventoryMovementRepository repository) { this.repository = repository; }

    public PageResponse<InventoryMovementResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("movementId")));
        return new PageResponse<>(p.getContent().stream().map(InventoryMovementResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InventoryMovementResponse get(Long id) {
        return InventoryMovementResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public InventoryMovementResponse create(CreateInventoryMovementRequest req) {
        var entity = InventoryMovement.builder()
                .dgtId(req.dgtId())
                .productId(req.productId())
                .movementType(req.movementType())
                .qtyChanged(req.qtyChanged())
                .unitCost(req.unitCost())
                .referenceId(req.referenceId())
                .build();
        return InventoryMovementResponse.from(repository.save(entity));
    }

    @Transactional
    public InventoryMovementResponse update(Long id, UpdateInventoryMovementRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.movementType() != null) entity.setMovementType(req.movementType());
        if (req.qtyChanged() != null) entity.setQtyChanged(req.qtyChanged());
        if (req.unitCost() != null) entity.setUnitCost(req.unitCost());
        if (req.referenceId() != null) entity.setReferenceId(req.referenceId());
        return InventoryMovementResponse.from(repository.save(entity));
    }
}
