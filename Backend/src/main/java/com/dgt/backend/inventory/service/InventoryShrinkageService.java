package com.dgt.backend.inventory.service;

import com.dgt.backend.inventory.dto.InventoryShrinkageResponse;
import com.dgt.backend.inventory.dto.CreateInventoryShrinkageRequest;
import com.dgt.backend.inventory.dto.UpdateInventoryShrinkageRequest;
import com.dgt.backend.inventory.entity.InventoryShrinkage;
import com.dgt.backend.inventory.repository.InventoryShrinkageRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InventoryShrinkageService {
    private final InventoryShrinkageRepository repository;
    public InventoryShrinkageService(InventoryShrinkageRepository repository) { this.repository = repository; }

    public PageResponse<InventoryShrinkageResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("shrinkageId")));
        return new PageResponse<>(p.getContent().stream().map(InventoryShrinkageResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InventoryShrinkageResponse get(Long id) {
        return InventoryShrinkageResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public InventoryShrinkageResponse create(CreateInventoryShrinkageRequest req) {
        var entity = InventoryShrinkage.builder()
                .dgtId(req.dgtId())
                .shrinkageDate(req.shrinkageDate())
                .reasonType(req.reasonType())
                .createdBy(req.createdBy())
                .build();
        return InventoryShrinkageResponse.from(repository.save(entity));
    }

    @Transactional
    public InventoryShrinkageResponse update(Long id, UpdateInventoryShrinkageRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.shrinkageDate() != null) entity.setShrinkageDate(req.shrinkageDate());
        if (req.reasonType() != null) entity.setReasonType(req.reasonType());
        if (req.createdBy() != null) entity.setCreatedBy(req.createdBy());
        return InventoryShrinkageResponse.from(repository.save(entity));
    }
}
