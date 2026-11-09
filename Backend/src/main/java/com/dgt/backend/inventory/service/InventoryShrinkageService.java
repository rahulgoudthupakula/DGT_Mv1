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
import lombok.extern.slf4j.Slf4j;

/**
 * JPA CRUD operations for InventoryShrinkage.
 * The caller is responsible for authorization and workflow validation; these queries add no store predicate.
 */

@Slf4j
@Service
public class InventoryShrinkageService {
    private final InventoryShrinkageRepository repository;
    public InventoryShrinkageService(InventoryShrinkageRepository repository) { this.repository = repository; }

    /** Load a page sorted by primary key and map its records to response DTOs. */
    public PageResponse<InventoryShrinkageResponse> list(int page, int size) {
        log.debug("Listing inventory shrinkage page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("shrinkageId")));
        log.debug("InventoryShrinkage list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(InventoryShrinkageResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load a record by ID or return HTTP 404. */
    public InventoryShrinkageResponse get(Long id) {
        log.debug("Fetching inventory shrinkage id={}", id);
        return InventoryShrinkageResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InventoryShrinkage not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
    @Transactional
    public InventoryShrinkageResponse create(CreateInventoryShrinkageRequest req) {
        log.info("Creating inventory shrinkage");
        // Save the shrinkage header; loss items and inventory posting are separate operations.
        var entity = InventoryShrinkage.builder()
                .dgtId(req.dgtId())
                .shrinkageDate(req.shrinkageDate())
                .reasonType(req.reasonType())
                .createdBy(req.createdBy())
                .build();
        var saved = repository.save(entity);
        log.info("Created inventory shrinkage id={}", saved.getShrinkageId());
        return InventoryShrinkageResponse.from(saved);
    }

    /** Apply only non-null fields in one transaction, leaving omitted fields unchanged. */
    @Transactional
    public InventoryShrinkageResponse update(Long id, UpdateInventoryShrinkageRequest req) {
        log.info("Updating inventory shrinkage id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InventoryShrinkage not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.shrinkageDate() != null) entity.setShrinkageDate(req.shrinkageDate());
        if (req.reasonType() != null) entity.setReasonType(req.reasonType());
        if (req.createdBy() != null) entity.setCreatedBy(req.createdBy());
        var saved = repository.save(entity);
        log.info("Updated inventory shrinkage id={}", id);
        return InventoryShrinkageResponse.from(saved);
    }
}
