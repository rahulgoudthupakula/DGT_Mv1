package com.dgt.backend.fuel.service;

import com.dgt.backend.fuel.dto.FuelPumpResponse;
import com.dgt.backend.fuel.dto.CreateFuelPumpRequest;
import com.dgt.backend.fuel.dto.UpdateFuelPumpRequest;
import com.dgt.backend.fuel.entity.FuelPump;
import com.dgt.backend.fuel.repository.FuelPumpRepository;
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
public class FuelPumpService {
    private final FuelPumpRepository repository;
    public FuelPumpService(FuelPumpRepository repository) { this.repository = repository; }

    public PageResponse<FuelPumpResponse> list(int page, int size) {
        log.debug("Listing fuel pump page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("pumpId")));
        log.debug("FuelPump list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(FuelPumpResponse::from).toList(), page, size, p.getTotalElements());
    }

    public FuelPumpResponse get(Long id) {
        log.debug("Fetching fuel pump id={}", id);
        return FuelPumpResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("FuelPump not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public FuelPumpResponse create(CreateFuelPumpRequest req) {
        log.info("Creating fuel pump");
        var entity = FuelPump.builder()
                .dgtId(req.dgtId())
                .pumpNumber(req.pumpNumber())
                .status(req.status())
                .serialNumber(req.serialNumber())
                .build();
        var saved = repository.save(entity);
        log.info("Created fuel pump id={}", saved.getFuelPumpId());
        return FuelPumpResponse.from(saved);
    }

    @Transactional
    public FuelPumpResponse update(Long id, UpdateFuelPumpRequest req) {
        log.info("Updating fuel pump id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("FuelPump not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.pumpNumber() != null) entity.setPumpNumber(req.pumpNumber());
        if (req.status() != null) entity.setStatus(req.status());
        if (req.serialNumber() != null) entity.setSerialNumber(req.serialNumber());
        var saved = repository.save(entity);
        log.info("Updated fuel pump id={}", id);
        return FuelPumpResponse.from(saved);
    }
}
