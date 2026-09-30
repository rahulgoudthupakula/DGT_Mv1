package com.dgt.backend.inventory.service;

import com.dgt.backend.inventory.dto.InventoryReturnResponse;
import com.dgt.backend.inventory.dto.CreateInventoryReturnRequest;
import com.dgt.backend.inventory.dto.UpdateInventoryReturnRequest;
import com.dgt.backend.inventory.entity.InventoryReturn;
import com.dgt.backend.inventory.repository.InventoryReturnRepository;
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
public class InventoryReturnService {
    private final InventoryReturnRepository repository;
    public InventoryReturnService(InventoryReturnRepository repository) { this.repository = repository; }

    public PageResponse<InventoryReturnResponse> list(int page, int size) {
        log.debug("Listing inventory return page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("returnId")));
        log.debug("InventoryReturn list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(InventoryReturnResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InventoryReturnResponse get(Long id) {
        log.debug("Fetching inventory return id={}", id);
        return InventoryReturnResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InventoryReturn not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public InventoryReturnResponse create(CreateInventoryReturnRequest req) {
        log.info("Creating inventory return");
        var entity = InventoryReturn.builder()
                .dgtId(req.dgtId())
                .vendorId(req.vendorId())
                .returnType(req.returnType())
                .referenceNumber(req.referenceNumber())
                .status(req.status())
                .build();
        var saved = repository.save(entity);
        log.info("Created inventory return id={}", saved.getInventoryReturnId());
        return InventoryReturnResponse.from(saved);
    }

    @Transactional
    public InventoryReturnResponse update(Long id, UpdateInventoryReturnRequest req) {
        log.info("Updating inventory return id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InventoryReturn not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.vendorId() != null) entity.setVendorId(req.vendorId());
        if (req.returnType() != null) entity.setReturnType(req.returnType());
        if (req.referenceNumber() != null) entity.setReferenceNumber(req.referenceNumber());
        if (req.status() != null) entity.setStatus(req.status());
        var saved = repository.save(entity);
        log.info("Updated inventory return id={}", id);
        return InventoryReturnResponse.from(saved);
    }
}
