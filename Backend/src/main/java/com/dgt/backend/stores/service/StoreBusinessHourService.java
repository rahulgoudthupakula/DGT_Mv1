package com.dgt.backend.stores.service;

import com.dgt.backend.stores.dto.StoreBusinessHourResponse;
import com.dgt.backend.stores.dto.CreateStoreBusinessHourRequest;
import com.dgt.backend.stores.dto.UpdateStoreBusinessHourRequest;
import com.dgt.backend.stores.entity.StoreBusinessHour;
import com.dgt.backend.stores.repository.StoreBusinessHourRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StoreBusinessHourService {
    private final StoreBusinessHourRepository repository;
    public StoreBusinessHourService(StoreBusinessHourRepository repository) { this.repository = repository; }

    public PageResponse<StoreBusinessHourResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("businessHoursId")));
        return new PageResponse<>(p.getContent().stream().map(StoreBusinessHourResponse::from).toList(), page, size, p.getTotalElements());
    }

    public StoreBusinessHourResponse get(Long id) {
        return StoreBusinessHourResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public StoreBusinessHourResponse create(CreateStoreBusinessHourRequest req) {
        var entity = StoreBusinessHour.builder()
                .dgtId(req.dgtId())
                .dayOfWeek(req.dayOfWeek())
                .openTime(req.openTime())
                .closeTime(req.closeTime())
                .status(req.status())
                .build();
        return StoreBusinessHourResponse.from(repository.save(entity));
    }

    @Transactional
    public StoreBusinessHourResponse update(Long id, UpdateStoreBusinessHourRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.dayOfWeek() != null) entity.setDayOfWeek(req.dayOfWeek());
        if (req.openTime() != null) entity.setOpenTime(req.openTime());
        if (req.closeTime() != null) entity.setCloseTime(req.closeTime());
        if (req.status() != null) entity.setStatus(req.status());
        return StoreBusinessHourResponse.from(repository.save(entity));
    }
}
