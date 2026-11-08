package com.dgt.backend.lottery.service;

import com.dgt.backend.lottery.dto.LotteryPackInventoryResponse;
import com.dgt.backend.lottery.dto.CreateLotteryPackInventoryRequest;
import com.dgt.backend.lottery.dto.UpdateLotteryPackInventoryRequest;
import com.dgt.backend.lottery.entity.LotteryPackInventory;
import com.dgt.backend.lottery.repository.LotteryPackInventoryRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA CRUD operations for LotteryPackInventory.
 * The caller is responsible for authorization and workflow validation; these queries add no store predicate.
 */

@Slf4j
@Service
public class LotteryPackInventoryService {
    private final LotteryPackInventoryRepository repository;
    public LotteryPackInventoryService(LotteryPackInventoryRepository repository) { this.repository = repository; }

    /** Load a page sorted by primary key and map its records to response DTOs. */
    public PageResponse<LotteryPackInventoryResponse> list(int page, int size) {
        log.debug("Listing lottery pack inventory page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("lotteryPackInventoryId")));
        log.debug("LotteryPackInventory list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(LotteryPackInventoryResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load a record by ID or return HTTP 404. */
    public LotteryPackInventoryResponse get(Long id) {
        log.debug("Fetching lottery pack inventory id={}", id);
        return LotteryPackInventoryResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("LotteryPackInventory not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
    @Transactional
    public LotteryPackInventoryResponse create(CreateLotteryPackInventoryRequest req) {
        log.info("Creating lottery pack inventory");
        var entity = LotteryPackInventory.builder()
                .dgtId(req.dgtId())
                .shiftOpenedBy(req.shiftOpenedBy())
                .shiftOpenedAt(req.shiftOpenedAt())
                .shiftClosedAt(req.shiftClosedAt())
                .build();
        var saved = repository.save(entity);
        log.info("Created lottery pack inventory id={}", saved.getLotteryPackInventoryId());
        return LotteryPackInventoryResponse.from(saved);
    }

    /** Apply only non-null fields in one transaction, leaving omitted fields unchanged. */
    @Transactional
    public LotteryPackInventoryResponse update(Long id, UpdateLotteryPackInventoryRequest req) {
        log.info("Updating lottery pack inventory id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("LotteryPackInventory not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.shiftOpenedBy() != null) entity.setShiftOpenedBy(req.shiftOpenedBy());
        if (req.shiftOpenedAt() != null) entity.setShiftOpenedAt(req.shiftOpenedAt());
        if (req.shiftClosedAt() != null) entity.setShiftClosedAt(req.shiftClosedAt());
        var saved = repository.save(entity);
        log.info("Updated lottery pack inventory id={}", id);
        return LotteryPackInventoryResponse.from(saved);
    }
}
