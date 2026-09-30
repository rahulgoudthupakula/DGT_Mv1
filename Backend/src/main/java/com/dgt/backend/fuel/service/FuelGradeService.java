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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class FuelGradeService {
    private final FuelGradeRepository repository;
    public FuelGradeService(FuelGradeRepository repository) { this.repository = repository; }

    public PageResponse<FuelGradeResponse> list(int page, int size) {
        log.debug("Listing fuel grade page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("fuelGradeId")));
        log.debug("FuelGrade list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(FuelGradeResponse::from).toList(), page, size, p.getTotalElements());
    }

    public FuelGradeResponse get(Long id) {
        log.debug("Fetching fuel grade id={}", id);
        return FuelGradeResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("FuelGrade not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public FuelGradeResponse create(CreateFuelGradeRequest req) {
        log.info("Creating fuel grade");
        var entity = FuelGrade.builder()
                .fuelType(req.fuelType())
                .gradeName(req.gradeName())
                .octaneRating(req.octaneRating())
                .isActive(req.isActive())
                .build();
        var saved = repository.save(entity);
        log.info("Created fuel grade id={}", saved.getFuelGradeId());
        return FuelGradeResponse.from(saved);
    }

    @Transactional
    public FuelGradeResponse update(Long id, UpdateFuelGradeRequest req) {
        log.info("Updating fuel grade id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("FuelGrade not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.fuelType() != null) entity.setFuelType(req.fuelType());
        if (req.gradeName() != null) entity.setGradeName(req.gradeName());
        if (req.octaneRating() != null) entity.setOctaneRating(req.octaneRating());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        var saved = repository.save(entity);
        log.info("Updated fuel grade id={}", id);
        return FuelGradeResponse.from(saved);
    }
}
