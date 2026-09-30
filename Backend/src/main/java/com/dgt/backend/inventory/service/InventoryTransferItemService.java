package com.dgt.backend.inventory.service;

import com.dgt.backend.inventory.dto.InventoryTransferItemResponse;
import com.dgt.backend.inventory.dto.CreateInventoryTransferItemRequest;
import com.dgt.backend.inventory.dto.UpdateInventoryTransferItemRequest;
import com.dgt.backend.inventory.entity.InventoryTransferItem;
import com.dgt.backend.inventory.repository.InventoryTransferItemRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InventoryTransferItemService {
    private final InventoryTransferItemRepository repository;
    public InventoryTransferItemService(InventoryTransferItemRepository repository) { this.repository = repository; }

    public PageResponse<InventoryTransferItemResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("transferItemId")));
        return new PageResponse<>(p.getContent().stream().map(InventoryTransferItemResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InventoryTransferItemResponse get(Long id) {
        return InventoryTransferItemResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public InventoryTransferItemResponse create(CreateInventoryTransferItemRequest req) {
        var entity = InventoryTransferItem.builder()
                .transferId(req.transferId())
                .productId(req.productId())
                .qtySent(req.qtySent())
                .qtyReceived(req.qtyReceived())
                .unitCost(req.unitCost())
                .build();
        return InventoryTransferItemResponse.from(repository.save(entity));
    }

    @Transactional
    public InventoryTransferItemResponse update(Long id, UpdateInventoryTransferItemRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.transferId() != null) entity.setTransferId(req.transferId());
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.qtySent() != null) entity.setQtySent(req.qtySent());
        if (req.qtyReceived() != null) entity.setQtyReceived(req.qtyReceived());
        if (req.unitCost() != null) entity.setUnitCost(req.unitCost());
        return InventoryTransferItemResponse.from(repository.save(entity));
    }
}
