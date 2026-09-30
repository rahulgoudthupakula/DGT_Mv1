package com.dgt.backend.dailyclosing.service;

import com.dgt.backend.dailyclosing.dto.EverydayClosingResponse;
import com.dgt.backend.dailyclosing.dto.CreateEverydayClosingRequest;
import com.dgt.backend.dailyclosing.dto.UpdateEverydayClosingRequest;
import com.dgt.backend.dailyclosing.entity.EverydayClosing;
import com.dgt.backend.dailyclosing.repository.EverydayClosingRepository;
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
public class EverydayClosingService {
    private final EverydayClosingRepository repository;
    public EverydayClosingService(EverydayClosingRepository repository) { this.repository = repository; }

    public PageResponse<EverydayClosingResponse> list(int page, int size) {
        log.debug("Listing everyday closing page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("everydayClosingId")));
        log.debug("EverydayClosing list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(EverydayClosingResponse::from).toList(), page, size, p.getTotalElements());
    }

    public EverydayClosingResponse get(Long id) {
        log.debug("Fetching everyday closing id={}", id);
        return EverydayClosingResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("EverydayClosing not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public EverydayClosingResponse create(CreateEverydayClosingRequest req) {
        log.info("Creating everyday closing");
        var entity = EverydayClosing.builder()
                .dgtId(req.dgtId())
                .openingDatetime(req.openingDatetime())
                .closingDatetime(req.closingDatetime())
                .totalGrossSales(req.totalGrossSales())
                .totalDiscounts(req.totalDiscounts())
                .totalTax(req.totalTax())
                .totalNetSales(req.totalNetSales())
                .totalRefunds(req.totalRefunds())
                .expectedCash(req.expectedCash())
                .actualCash(req.actualCash())
                .cashVariance(req.cashVariance())
                .totalDeposits(req.totalDeposits())
                .closedBy(req.closedBy())
                .build();
        var saved = repository.save(entity);
        log.info("Created everyday closing id={}", saved.getEverydayClosingId());
        return EverydayClosingResponse.from(saved);
    }

    @Transactional
    public EverydayClosingResponse update(Long id, UpdateEverydayClosingRequest req) {
        log.info("Updating everyday closing id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("EverydayClosing not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.openingDatetime() != null) entity.setOpeningDatetime(req.openingDatetime());
        if (req.closingDatetime() != null) entity.setClosingDatetime(req.closingDatetime());
        if (req.totalGrossSales() != null) entity.setTotalGrossSales(req.totalGrossSales());
        if (req.totalDiscounts() != null) entity.setTotalDiscounts(req.totalDiscounts());
        if (req.totalTax() != null) entity.setTotalTax(req.totalTax());
        if (req.totalNetSales() != null) entity.setTotalNetSales(req.totalNetSales());
        if (req.totalRefunds() != null) entity.setTotalRefunds(req.totalRefunds());
        if (req.expectedCash() != null) entity.setExpectedCash(req.expectedCash());
        if (req.actualCash() != null) entity.setActualCash(req.actualCash());
        if (req.cashVariance() != null) entity.setCashVariance(req.cashVariance());
        if (req.totalDeposits() != null) entity.setTotalDeposits(req.totalDeposits());
        if (req.closedBy() != null) entity.setClosedBy(req.closedBy());
        var saved = repository.save(entity);
        log.info("Updated everyday closing id={}", id);
        return EverydayClosingResponse.from(saved);
    }
}
