package com.dgt.backend.fuel.service;

import com.dgt.backend.fuel.dto.FuelTankResponse;
import com.dgt.backend.fuel.dto.CreateFuelTankRequest;
import com.dgt.backend.fuel.dto.UpdateFuelTankRequest;
import com.dgt.backend.fuel.entity.FuelTank;
import com.dgt.backend.fuel.repository.FuelTankRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA CRUD operations for FuelTank.
 * The caller is responsible for authorization and workflow validation; these queries add no store predicate.
 */

@Slf4j
@Service
public class FuelTankService {
    private final FuelTankRepository repository;
    public FuelTankService(FuelTankRepository repository) { this.repository = repository; }

    /** Load a page sorted by primary key and map its records to response DTOs. */
    public PageResponse<FuelTankResponse> list(int page, int size) {
        log.debug("Listing fuel tank page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("tankId")));
        log.debug("FuelTank list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(FuelTankResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load a record by ID or return HTTP 404. */
    public FuelTankResponse get(Long id) {
        log.debug("Fetching fuel tank id={}", id);
        return FuelTankResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("FuelTank not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
    @Transactional
    public FuelTankResponse create(CreateFuelTankRequest req) {
        log.info("Creating fuel tank");
        var entity = FuelTank.builder()
                .dgtId(req.dgtId())
                .tankNumber(req.tankNumber())
                .tankName(req.tankName())
                .capacityGallons(req.capacityGallons())
                .safeFillCapacity(req.safeFillCapacity())
                .build();
        var saved = repository.save(entity);
        log.info("Created fuel tank id={}", saved.getTankId());
        return FuelTankResponse.from(saved);
    }

    /** Apply only non-null fields in one transaction, leaving omitted fields unchanged. */
    @Transactional
    public FuelTankResponse update(Long id, UpdateFuelTankRequest req) {
        log.info("Updating fuel tank id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("FuelTank not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.tankNumber() != null) entity.setTankNumber(req.tankNumber());
        if (req.tankName() != null) entity.setTankName(req.tankName());
        if (req.capacityGallons() != null) entity.setCapacityGallons(req.capacityGallons());
        if (req.safeFillCapacity() != null) entity.setSafeFillCapacity(req.safeFillCapacity());
        var saved = repository.save(entity);
        log.info("Updated fuel tank id={}", id);
        return FuelTankResponse.from(saved);
    }
}
