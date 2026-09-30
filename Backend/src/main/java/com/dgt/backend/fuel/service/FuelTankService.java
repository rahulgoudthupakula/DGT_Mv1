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

@Service
public class FuelTankService {
    private final FuelTankRepository repository;
    public FuelTankService(FuelTankRepository repository) { this.repository = repository; }

    public PageResponse<FuelTankResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("tankId")));
        return new PageResponse<>(p.getContent().stream().map(FuelTankResponse::from).toList(), page, size, p.getTotalElements());
    }

    public FuelTankResponse get(Long id) {
        return FuelTankResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public FuelTankResponse create(CreateFuelTankRequest req) {
        var entity = FuelTank.builder()
                .dgtId(req.dgtId())
                .tankNumber(req.tankNumber())
                .tankName(req.tankName())
                .capacityGallons(req.capacityGallons())
                .safeFillCapacity(req.safeFillCapacity())
                .build();
        return FuelTankResponse.from(repository.save(entity));
    }

    @Transactional
    public FuelTankResponse update(Long id, UpdateFuelTankRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.tankNumber() != null) entity.setTankNumber(req.tankNumber());
        if (req.tankName() != null) entity.setTankName(req.tankName());
        if (req.capacityGallons() != null) entity.setCapacityGallons(req.capacityGallons());
        if (req.safeFillCapacity() != null) entity.setSafeFillCapacity(req.safeFillCapacity());
        return FuelTankResponse.from(repository.save(entity));
    }
}
