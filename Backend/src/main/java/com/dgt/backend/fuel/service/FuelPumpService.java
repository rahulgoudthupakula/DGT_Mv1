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

@Service
public class FuelPumpService {
    private final FuelPumpRepository repository;
    public FuelPumpService(FuelPumpRepository repository) { this.repository = repository; }

    public PageResponse<FuelPumpResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("pumpId")));
        return new PageResponse<>(p.getContent().stream().map(FuelPumpResponse::from).toList(), page, size, p.getTotalElements());
    }

    public FuelPumpResponse get(Long id) {
        return FuelPumpResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public FuelPumpResponse create(CreateFuelPumpRequest req) {
        var entity = FuelPump.builder()
                .dgtId(req.dgtId())
                .pumpNumber(req.pumpNumber())
                .status(req.status())
                .serialNumber(req.serialNumber())
                .build();
        return FuelPumpResponse.from(repository.save(entity));
    }

    @Transactional
    public FuelPumpResponse update(Long id, UpdateFuelPumpRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.pumpNumber() != null) entity.setPumpNumber(req.pumpNumber());
        if (req.status() != null) entity.setStatus(req.status());
        if (req.serialNumber() != null) entity.setSerialNumber(req.serialNumber());
        return FuelPumpResponse.from(repository.save(entity));
    }
}
