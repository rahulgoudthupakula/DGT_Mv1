package com.dgt.backend.inventory.service;

import com.dgt.backend.inventory.dto.InventoryReductionRequestResponse;
import com.dgt.backend.inventory.dto.CreateInventoryReductionRequestRequest;
import com.dgt.backend.inventory.dto.UpdateInventoryReductionRequestRequest;
import com.dgt.backend.inventory.entity.InventoryReductionRequest;
import com.dgt.backend.inventory.repository.InventoryReductionRequestRepository;
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
public class InventoryReductionRequestService {
    private final InventoryReductionRequestRepository repository;
    public InventoryReductionRequestService(InventoryReductionRequestRepository repository) { this.repository = repository; }

    public PageResponse<InventoryReductionRequestResponse> list(int page, int size) {
        log.debug("Listing inventory reduction request page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("reductionRequestId")));
        log.debug("InventoryReductionRequest list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(InventoryReductionRequestResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InventoryReductionRequestResponse get(Long id) {
        log.debug("Fetching inventory reduction request id={}", id);
        return InventoryReductionRequestResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InventoryReductionRequest not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public InventoryReductionRequestResponse create(CreateInventoryReductionRequestRequest req) {
        log.info("Creating inventory reduction request");
        var entity = InventoryReductionRequest.builder()
                .dgtId(req.dgtId())
                .productId(req.productId())
                .requestType(req.requestType())
                .quantity(req.quantity())
                .reason(req.reason())
                .status(req.status())
                .notes(req.notes())
                .destination(req.destination())
                .requestedBy(req.requestedBy())
                .rejectionReason(req.rejectionReason())
                .build();
        var saved = repository.save(entity);
        log.info("Created inventory reduction request id={}", saved.getInventoryReductionRequestId());
        return InventoryReductionRequestResponse.from(saved);
    }

    @Transactional
    public InventoryReductionRequestResponse update(Long id, UpdateInventoryReductionRequestRequest req) {
        log.info("Updating inventory reduction request id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InventoryReductionRequest not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.requestType() != null) entity.setRequestType(req.requestType());
        if (req.quantity() != null) entity.setQuantity(req.quantity());
        if (req.reason() != null) entity.setReason(req.reason());
        if (req.status() != null) entity.setStatus(req.status());
        if (req.notes() != null) entity.setNotes(req.notes());
        if (req.destination() != null) entity.setDestination(req.destination());
        if (req.requestedBy() != null) entity.setRequestedBy(req.requestedBy());
        if (req.rejectionReason() != null) entity.setRejectionReason(req.rejectionReason());
        var saved = repository.save(entity);
        log.info("Updated inventory reduction request id={}", id);
        return InventoryReductionRequestResponse.from(saved);
    }
}
