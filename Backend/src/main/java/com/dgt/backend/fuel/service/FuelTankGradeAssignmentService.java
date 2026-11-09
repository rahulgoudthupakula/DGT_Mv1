package com.dgt.backend.fuel.service;

import com.dgt.backend.fuel.dto.FuelTankGradeAssignmentResponse;
import com.dgt.backend.fuel.dto.CreateFuelTankGradeAssignmentRequest;
import com.dgt.backend.fuel.dto.UpdateFuelTankGradeAssignmentRequest;
import com.dgt.backend.fuel.entity.FuelTankGradeAssignment;
import com.dgt.backend.fuel.repository.FuelTankGradeAssignmentRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA CRUD operations for FuelTankGradeAssignment.
 * The caller is responsible for authorization and workflow validation; these queries add no store predicate.
 */

@Slf4j
@Service
public class FuelTankGradeAssignmentService {
    private final FuelTankGradeAssignmentRepository repository;
    public FuelTankGradeAssignmentService(FuelTankGradeAssignmentRepository repository) { this.repository = repository; }

    /** Load a page sorted by primary key and map its records to response DTOs. */
    public PageResponse<FuelTankGradeAssignmentResponse> list(int page, int size) {
        log.debug("Listing fuel tank grade assignment page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("assignmentId")));
        log.debug("FuelTankGradeAssignment list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(FuelTankGradeAssignmentResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load a record by ID or return HTTP 404. */
    public FuelTankGradeAssignmentResponse get(Long id) {
        log.debug("Fetching fuel tank grade assignment id={}", id);
        return FuelTankGradeAssignmentResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("FuelTankGradeAssignment not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
    @Transactional
    public FuelTankGradeAssignmentResponse create(CreateFuelTankGradeAssignmentRequest req) {
        log.info("Creating fuel tank grade assignment");
        var entity = FuelTankGradeAssignment.builder()
                .tankId(req.tankId())
                .fuelGradeId(req.fuelGradeId())
                .effectiveFrom(req.effectiveFrom())
                .effectiveTo(req.effectiveTo())
                .build();
        var saved = repository.save(entity);
        log.info("Created fuel tank grade assignment id={}", saved.getAssignmentId());
        return FuelTankGradeAssignmentResponse.from(saved);
    }

    /** Apply only non-null fields in one transaction, leaving omitted fields unchanged. */
    @Transactional
    public FuelTankGradeAssignmentResponse update(Long id, UpdateFuelTankGradeAssignmentRequest req) {
        log.info("Updating fuel tank grade assignment id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("FuelTankGradeAssignment not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.tankId() != null) entity.setTankId(req.tankId());
        if (req.fuelGradeId() != null) entity.setFuelGradeId(req.fuelGradeId());
        if (req.effectiveFrom() != null) entity.setEffectiveFrom(req.effectiveFrom());
        if (req.effectiveTo() != null) entity.setEffectiveTo(req.effectiveTo());
        var saved = repository.save(entity);
        log.info("Updated fuel tank grade assignment id={}", id);
        return FuelTankGradeAssignmentResponse.from(saved);
    }
}
