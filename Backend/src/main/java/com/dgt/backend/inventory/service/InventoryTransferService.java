package com.dgt.backend.inventory.service;

import com.dgt.backend.inventory.dto.InventoryTransferResponse;
import com.dgt.backend.inventory.dto.CreateInventoryTransferRequest;
import com.dgt.backend.inventory.dto.UpdateInventoryTransferRequest;
import com.dgt.backend.inventory.entity.InventoryTransfer;
import com.dgt.backend.inventory.repository.InventoryTransferRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InventoryTransferService {
    private final InventoryTransferRepository repository;
    public InventoryTransferService(InventoryTransferRepository repository) { this.repository = repository; }

    public PageResponse<InventoryTransferResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("transferId")));
        return new PageResponse<>(p.getContent().stream().map(InventoryTransferResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InventoryTransferResponse get(Long id) {
        return InventoryTransferResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public InventoryTransferResponse create(CreateInventoryTransferRequest req) {
        var entity = InventoryTransfer.builder()
                .fromDgtId(req.fromDgtId())
                .toDgtId(req.toDgtId())
                .transferDate(req.transferDate())
                .status(req.status())
                .createdBy(req.createdBy())
                .build();
        return InventoryTransferResponse.from(repository.save(entity));
    }

    @Transactional
    public InventoryTransferResponse update(Long id, UpdateInventoryTransferRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.fromDgtId() != null) entity.setFromDgtId(req.fromDgtId());
        if (req.toDgtId() != null) entity.setToDgtId(req.toDgtId());
        if (req.transferDate() != null) entity.setTransferDate(req.transferDate());
        if (req.status() != null) entity.setStatus(req.status());
        if (req.createdBy() != null) entity.setCreatedBy(req.createdBy());
        return InventoryTransferResponse.from(repository.save(entity));
    }
}
