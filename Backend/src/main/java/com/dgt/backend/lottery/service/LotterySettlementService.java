package com.dgt.backend.lottery.service;

import com.dgt.backend.lottery.dto.LotterySettlementResponse;
import com.dgt.backend.lottery.dto.CreateLotterySettlementRequest;
import com.dgt.backend.lottery.dto.UpdateLotterySettlementRequest;
import com.dgt.backend.lottery.entity.LotterySettlement;
import com.dgt.backend.lottery.repository.LotterySettlementRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA CRUD operations for LotterySettlement.
 * The caller is responsible for authorization and workflow validation; these queries add no store predicate.
 */

@Slf4j
@Service
public class LotterySettlementService {
    private final LotterySettlementRepository repository;
    public LotterySettlementService(LotterySettlementRepository repository) { this.repository = repository; }

    /** Load a page sorted by primary key and map its records to response DTOs. */
    public PageResponse<LotterySettlementResponse> list(int page, int size) {
        log.debug("Listing lottery settlement page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("lotterySettlementId")));
        log.debug("LotterySettlement list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(LotterySettlementResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load a record by ID or return HTTP 404. */
    public LotterySettlementResponse get(Long id) {
        log.debug("Fetching lottery settlement id={}", id);
        return LotterySettlementResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("LotterySettlement not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
    @Transactional
    public LotterySettlementResponse create(CreateLotterySettlementRequest req) {
        log.info("Creating lottery settlement");
        var entity = LotterySettlement.builder()
                .dgtId(req.dgtId())
                .vendorId(req.vendorId())
                .settlementReference(req.settlementReference())
                .periodType(req.periodType())
                .periodStartDate(req.periodStartDate())
                .periodEndDate(req.periodEndDate())
                .totalSales(req.totalSales())
                .totalCommission(req.totalCommission())
                .statusTypeId(req.statusTypeId())
                .createdBy(req.createdBy())
                .paidAt(req.paidAt())
                .build();
        var saved = repository.save(entity);
        log.info("Created lottery settlement id={}", saved.getLotterySettlementId());
        return LotterySettlementResponse.from(saved);
    }

    /** Apply only non-null fields in one transaction, leaving omitted fields unchanged. */
    @Transactional
    public LotterySettlementResponse update(Long id, UpdateLotterySettlementRequest req) {
        log.info("Updating lottery settlement id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("LotterySettlement not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.vendorId() != null) entity.setVendorId(req.vendorId());
        if (req.settlementReference() != null) entity.setSettlementReference(req.settlementReference());
        if (req.periodType() != null) entity.setPeriodType(req.periodType());
        if (req.periodStartDate() != null) entity.setPeriodStartDate(req.periodStartDate());
        if (req.periodEndDate() != null) entity.setPeriodEndDate(req.periodEndDate());
        if (req.totalSales() != null) entity.setTotalSales(req.totalSales());
        if (req.totalCommission() != null) entity.setTotalCommission(req.totalCommission());
        if (req.statusTypeId() != null) entity.setStatusTypeId(req.statusTypeId());
        if (req.createdBy() != null) entity.setCreatedBy(req.createdBy());
        if (req.paidAt() != null) entity.setPaidAt(req.paidAt());
        var saved = repository.save(entity);
        log.info("Updated lottery settlement id={}", id);
        return LotterySettlementResponse.from(saved);
    }
}
