package com.dgt.backend.inventory.service;

import com.dgt.backend.inventory.dto.CreateInventoryRequest;
import com.dgt.backend.inventory.dto.InventoryResponse;
import com.dgt.backend.inventory.dto.UpdateInventoryRequest;
import com.dgt.backend.inventory.entity.Inventory;
import com.dgt.backend.inventory.repository.InventoryRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InventoryService {
    private final InventoryRepository repository;
    public InventoryService(InventoryRepository repository) { this.repository = repository; }

    public PageResponse<InventoryResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("inventoryId")));
        return new PageResponse<>(p.getContent().stream().map(InventoryResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InventoryResponse get(Long id) {
        return InventoryResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public InventoryResponse create(CreateInventoryRequest req) {
        var entity = Inventory.builder()
                .dgtId(req.dgtId())
                .productId(req.productId())
                .availableQuantity(req.availableQuantity())
                .cost(req.cost())
                .returnCost(req.returnCost())
                .build();
        return InventoryResponse.from(repository.save(entity));
    }

    @Transactional
    public InventoryResponse update(Long id, UpdateInventoryRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.availableQuantity() != null) entity.setAvailableQuantity(req.availableQuantity());
        if (req.cost() != null) entity.setCost(req.cost());
        if (req.returnCost() != null) entity.setReturnCost(req.returnCost());
        return InventoryResponse.from(repository.save(entity));
    }
}
