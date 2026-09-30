package com.dgt.backend.fuel.service;

import com.dgt.backend.fuel.dto.FuelTankReadingResponse;
import com.dgt.backend.fuel.dto.CreateFuelTankReadingRequest;
import com.dgt.backend.fuel.dto.UpdateFuelTankReadingRequest;
import com.dgt.backend.fuel.entity.FuelTankReading;
import com.dgt.backend.fuel.repository.FuelTankReadingRepository;
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
public class FuelTankReadingService {
    private final FuelTankReadingRepository repository;
    public FuelTankReadingService(FuelTankReadingRepository repository) { this.repository = repository; }

    public PageResponse<FuelTankReadingResponse> list(int page, int size) {
        log.debug("Listing fuel tank reading page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("tankReadingId")));
        log.debug("FuelTankReading list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(FuelTankReadingResponse::from).toList(), page, size, p.getTotalElements());
    }

    public FuelTankReadingResponse get(Long id) {
        log.debug("Fetching fuel tank reading id={}", id);
        return FuelTankReadingResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("FuelTankReading not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public FuelTankReadingResponse create(CreateFuelTankReadingRequest req) {
        log.info("Creating fuel tank reading");
        var entity = FuelTankReading.builder()
                .tankId(req.tankId())
                .readingDatetime(req.readingDatetime())
                .volumeGallons(req.volumeGallons())
                .temperature(req.temperature())
                .ullage(req.ullage())
                .createdBy(req.createdBy())
                .imageUrl(req.imageUrl())
                .build();
        var saved = repository.save(entity);
        log.info("Created fuel tank reading id={}", saved.getFuelTankReadingId());
        return FuelTankReadingResponse.from(saved);
    }

    @Transactional
    public FuelTankReadingResponse update(Long id, UpdateFuelTankReadingRequest req) {
        log.info("Updating fuel tank reading id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("FuelTankReading not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.tankId() != null) entity.setTankId(req.tankId());
        if (req.readingDatetime() != null) entity.setReadingDatetime(req.readingDatetime());
        if (req.volumeGallons() != null) entity.setVolumeGallons(req.volumeGallons());
        if (req.temperature() != null) entity.setTemperature(req.temperature());
        if (req.ullage() != null) entity.setUllage(req.ullage());
        if (req.createdBy() != null) entity.setCreatedBy(req.createdBy());
        if (req.imageUrl() != null) entity.setImageUrl(req.imageUrl());
        var saved = repository.save(entity);
        log.info("Updated fuel tank reading id={}", id);
        return FuelTankReadingResponse.from(saved);
    }
}
