package com.dgt.backend.fuel.service;

import com.dgt.backend.fuel.dto.FuelGradeResponse;
import com.dgt.backend.fuel.dto.CreateFuelGradeRequest;
import com.dgt.backend.fuel.dto.UpdateFuelGradeRequest;
import com.dgt.backend.fuel.entity.FuelGrade;
import com.dgt.backend.fuel.repository.FuelGradeRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FuelGradeService {
    private final FuelGradeRepository repository;
    public FuelGradeService(FuelGradeRepository repository) { this.repository = repository; }

    public PageResponse<FuelGradeResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("fuelGradeId")));
        return new PageResponse<>(p.getContent().stream().map(FuelGradeResponse::from).toList(), page, size, p.getTotalElements());
    }

    public FuelGradeResponse get(Long id) {
        return FuelGradeResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public FuelGradeResponse create(CreateFuelGradeRequest req) {
        var entity = FuelGrade.builder()
                .fuelType(req.fuelType())
                .gradeName(req.gradeName())
                .octaneRating(req.octaneRating())
                .isActive(req.isActive())
                .build();
        return FuelGradeResponse.from(repository.save(entity));
    }

    @Transactional
    public FuelGradeResponse update(Long id, UpdateFuelGradeRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.fuelType() != null) entity.setFuelType(req.fuelType());
        if (req.gradeName() != null) entity.setGradeName(req.gradeName());
        if (req.octaneRating() != null) entity.setOctaneRating(req.octaneRating());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        return FuelGradeResponse.from(repository.save(entity));
    }
}
