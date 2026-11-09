package com.dgt.backend.lottery.service;

import com.dgt.backend.lottery.dto.LotteryPackInventoryItemResponse;
import com.dgt.backend.lottery.dto.CreateLotteryPackInventoryItemRequest;
import com.dgt.backend.lottery.dto.UpdateLotteryPackInventoryItemRequest;
import com.dgt.backend.lottery.entity.LotteryPackInventoryItem;
import com.dgt.backend.lottery.repository.LotteryPackInventoryItemRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA CRUD operations for LotteryPackInventoryItem.
 * The caller is responsible for authorization and workflow validation; these queries add no store predicate.
 */

@Slf4j
@Service
public class LotteryPackInventoryItemService {
    private final LotteryPackInventoryItemRepository repository;
    public LotteryPackInventoryItemService(LotteryPackInventoryItemRepository repository) { this.repository = repository; }

    /** Load a page sorted by primary key and map its records to response DTOs. */
    public PageResponse<LotteryPackInventoryItemResponse> list(int page, int size) {
        log.debug("Listing lottery pack inventory item page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("lotteryPackInventoryItemId")));
        log.debug("LotteryPackInventoryItem list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(LotteryPackInventoryItemResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load a record by ID or return HTTP 404. */
    public LotteryPackInventoryItemResponse get(Long id) {
        log.debug("Fetching lottery pack inventory item id={}", id);
        return LotteryPackInventoryItemResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("LotteryPackInventoryItem not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
    @Transactional
    public LotteryPackInventoryItemResponse create(CreateLotteryPackInventoryItemRequest req) {
        log.info("Creating lottery pack inventory item");
        var entity = LotteryPackInventoryItem.builder()
                .lotteryPackInventoryId(req.lotteryPackInventoryId())
                .openTicketNumber(req.openTicketNumber())
                .lastSoldTicketNumber(req.lastSoldTicketNumber())
                .physicalQuantity(req.physicalQuantity())
                .packId(req.packId())
                .commissionAmount(req.commissionAmount())
                .expectedCash(req.expectedCash())
                .build();
        var saved = repository.save(entity);
        log.info("Created lottery pack inventory item id={}", saved.getLotteryPackInventoryItemId());
        return LotteryPackInventoryItemResponse.from(saved);
    }

    /** Apply only non-null fields in one transaction, leaving omitted fields unchanged. */
    @Transactional
    public LotteryPackInventoryItemResponse update(Long id, UpdateLotteryPackInventoryItemRequest req) {
        log.info("Updating lottery pack inventory item id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("LotteryPackInventoryItem not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.lotteryPackInventoryId() != null) entity.setLotteryPackInventoryId(req.lotteryPackInventoryId());
        if (req.openTicketNumber() != null) entity.setOpenTicketNumber(req.openTicketNumber());
        if (req.lastSoldTicketNumber() != null) entity.setLastSoldTicketNumber(req.lastSoldTicketNumber());
        if (req.physicalQuantity() != null) entity.setPhysicalQuantity(req.physicalQuantity());
        if (req.packId() != null) entity.setPackId(req.packId());
        if (req.commissionAmount() != null) entity.setCommissionAmount(req.commissionAmount());
        if (req.expectedCash() != null) entity.setExpectedCash(req.expectedCash());
        var saved = repository.save(entity);
        log.info("Updated lottery pack inventory item id={}", id);
        return LotteryPackInventoryItemResponse.from(saved);
    }
}
