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

@Service
public class FuelTankGradeAssignmentService {
    private final FuelTankGradeAssignmentRepository repository;
    public FuelTankGradeAssignmentService(FuelTankGradeAssignmentRepository repository) { this.repository = repository; }

    public PageResponse<FuelTankGradeAssignmentResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("assignmentId")));
        return new PageResponse<>(p.getContent().stream().map(FuelTankGradeAssignmentResponse::from).toList(), page, size, p.getTotalElements());
    }

    public FuelTankGradeAssignmentResponse get(Long id) {
        return FuelTankGradeAssignmentResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public FuelTankGradeAssignmentResponse create(CreateFuelTankGradeAssignmentRequest req) {
        var entity = FuelTankGradeAssignment.builder()
                .tankId(req.tankId())
                .fuelGradeId(req.fuelGradeId())
                .effectiveFrom(req.effectiveFrom())
                .effectiveTo(req.effectiveTo())
                .build();
        return FuelTankGradeAssignmentResponse.from(repository.save(entity));
    }

    @Transactional
    public FuelTankGradeAssignmentResponse update(Long id, UpdateFuelTankGradeAssignmentRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.tankId() != null) entity.setTankId(req.tankId());
        if (req.fuelGradeId() != null) entity.setFuelGradeId(req.fuelGradeId());
        if (req.effectiveFrom() != null) entity.setEffectiveFrom(req.effectiveFrom());
        if (req.effectiveTo() != null) entity.setEffectiveTo(req.effectiveTo());
        return FuelTankGradeAssignmentResponse.from(repository.save(entity));
    }
}
