package com.dgt.backend.inventory.service;

import com.dgt.backend.inventory.dto.InventoryShrinkageItemResponse;
import com.dgt.backend.inventory.dto.CreateInventoryShrinkageItemRequest;
import com.dgt.backend.inventory.dto.UpdateInventoryShrinkageItemRequest;
import com.dgt.backend.inventory.entity.InventoryShrinkageItem;
import com.dgt.backend.inventory.repository.InventoryShrinkageItemRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InventoryShrinkageItemService {
    private final InventoryShrinkageItemRepository repository;
    public InventoryShrinkageItemService(InventoryShrinkageItemRepository repository) { this.repository = repository; }

    public PageResponse<InventoryShrinkageItemResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("shrinkageItemId")));
        return new PageResponse<>(p.getContent().stream().map(InventoryShrinkageItemResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InventoryShrinkageItemResponse get(Long id) {
        return InventoryShrinkageItemResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public InventoryShrinkageItemResponse create(CreateInventoryShrinkageItemRequest req) {
        var entity = InventoryShrinkageItem.builder()
                .shrinkageId(req.shrinkageId())
                .productId(req.productId())
                .qty(req.qty())
                .unitCost(req.unitCost())
                .lossAmount(req.lossAmount())
                .reason(req.reason())
                .build();
        return InventoryShrinkageItemResponse.from(repository.save(entity));
    }

    @Transactional
    public InventoryShrinkageItemResponse update(Long id, UpdateInventoryShrinkageItemRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.shrinkageId() != null) entity.setShrinkageId(req.shrinkageId());
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.qty() != null) entity.setQty(req.qty());
        if (req.unitCost() != null) entity.setUnitCost(req.unitCost());
        if (req.lossAmount() != null) entity.setLossAmount(req.lossAmount());
        if (req.reason() != null) entity.setReason(req.reason());
        return InventoryShrinkageItemResponse.from(repository.save(entity));
    }
}
