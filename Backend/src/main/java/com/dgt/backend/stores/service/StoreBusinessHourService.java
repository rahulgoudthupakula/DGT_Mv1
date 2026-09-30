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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class StoreBusinessHourService {
    private final StoreBusinessHourRepository repository;
    public StoreBusinessHourService(StoreBusinessHourRepository repository) { this.repository = repository; }

    public PageResponse<StoreBusinessHourResponse> list(int page, int size) {
        log.debug("Listing store business hour page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("businessHoursId")));
        log.debug("StoreBusinessHour list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(StoreBusinessHourResponse::from).toList(), page, size, p.getTotalElements());
    }

    public StoreBusinessHourResponse get(Long id) {
        log.debug("Fetching store business hour id={}", id);
        return StoreBusinessHourResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("StoreBusinessHour not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public StoreBusinessHourResponse create(CreateStoreBusinessHourRequest req) {
        log.info("Creating store business hour");
        var entity = StoreBusinessHour.builder()
                .dgtId(req.dgtId())
                .dayOfWeek(req.dayOfWeek())
                .openTime(req.openTime())
                .closeTime(req.closeTime())
                .status(req.status())
                .build();
        var saved = repository.save(entity);
        log.info("Created store business hour id={}", saved.getStoreBusinessHourId());
        return StoreBusinessHourResponse.from(saved);
    }

    @Transactional
    public StoreBusinessHourResponse update(Long id, UpdateStoreBusinessHourRequest req) {
        log.info("Updating store business hour id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("StoreBusinessHour not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.dayOfWeek() != null) entity.setDayOfWeek(req.dayOfWeek());
        if (req.openTime() != null) entity.setOpenTime(req.openTime());
        if (req.closeTime() != null) entity.setCloseTime(req.closeTime());
        if (req.status() != null) entity.setStatus(req.status());
        var saved = repository.save(entity);
        log.info("Updated store business hour id={}", id);
        return StoreBusinessHourResponse.from(saved);
    }
}
