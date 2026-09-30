package com.dgt.backend.fuel.service;

import com.dgt.backend.fuel.dto.FuelPriceResponse;
import com.dgt.backend.fuel.dto.CreateFuelPriceRequest;
import com.dgt.backend.fuel.dto.UpdateFuelPriceRequest;
import com.dgt.backend.fuel.entity.FuelPrice;
import com.dgt.backend.fuel.repository.FuelPriceRepository;
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
public class FuelPriceService {
    private final FuelPriceRepository repository;
    public FuelPriceService(FuelPriceRepository repository) { this.repository = repository; }

    public PageResponse<FuelPriceResponse> list(int page, int size) {
        log.debug("Listing fuel price page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("fuelPriceId")));
        log.debug("FuelPrice list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(FuelPriceResponse::from).toList(), page, size, p.getTotalElements());
    }

    public FuelPriceResponse get(Long id) {
        log.debug("Fetching fuel price id={}", id);
        return FuelPriceResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("FuelPrice not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public FuelPriceResponse create(CreateFuelPriceRequest req) {
        log.info("Creating fuel price");
        var entity = FuelPrice.builder()
                .dgtId(req.dgtId())
                .fuelGradeId(req.fuelGradeId())
                .cashPrice(req.cashPrice())
                .creditPrice(req.creditPrice())
                .effectiveFrom(req.effectiveFrom())
                .effectiveTo(req.effectiveTo())
                .changedBy(req.changedBy())
                .build();
        var saved = repository.save(entity);
        log.info("Created fuel price id={}", saved.getFuelPriceId());
        return FuelPriceResponse.from(saved);
    }

    @Transactional
    public FuelPriceResponse update(Long id, UpdateFuelPriceRequest req) {
        log.info("Updating fuel price id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("FuelPrice not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.fuelGradeId() != null) entity.setFuelGradeId(req.fuelGradeId());
        if (req.cashPrice() != null) entity.setCashPrice(req.cashPrice());
        if (req.creditPrice() != null) entity.setCreditPrice(req.creditPrice());
        if (req.effectiveFrom() != null) entity.setEffectiveFrom(req.effectiveFrom());
        if (req.effectiveTo() != null) entity.setEffectiveTo(req.effectiveTo());
        if (req.changedBy() != null) entity.setChangedBy(req.changedBy());
        var saved = repository.save(entity);
        log.info("Updated fuel price id={}", id);
        return FuelPriceResponse.from(saved);
    }
}
