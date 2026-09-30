package com.dgt.backend.dailyclosing.service;

import com.dgt.backend.dailyclosing.dto.DailyClosingDepositResponse;
import com.dgt.backend.dailyclosing.dto.CreateDailyClosingDepositRequest;
import com.dgt.backend.dailyclosing.dto.UpdateDailyClosingDepositRequest;
import com.dgt.backend.dailyclosing.entity.DailyClosingDeposit;
import com.dgt.backend.dailyclosing.repository.DailyClosingDepositRepository;
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
public class DailyClosingDepositService {
    private final DailyClosingDepositRepository repository;
    public DailyClosingDepositService(DailyClosingDepositRepository repository) { this.repository = repository; }

    public PageResponse<DailyClosingDepositResponse> list(int page, int size) {
        log.debug("Listing daily closing deposit page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("depositId")));
        log.debug("DailyClosingDeposit list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(DailyClosingDepositResponse::from).toList(), page, size, p.getTotalElements());
    }

    public DailyClosingDepositResponse get(Long id) {
        log.debug("Fetching daily closing deposit id={}", id);
        return DailyClosingDepositResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("DailyClosingDeposit not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public DailyClosingDepositResponse create(CreateDailyClosingDepositRequest req) {
        log.info("Creating daily closing deposit");
        var entity = DailyClosingDeposit.builder()
                .everydayClosingId(req.everydayClosingId())
                .depositDate(req.depositDate())
                .bankAccountId(req.bankAccountId())
                .amount(req.amount())
                .receiptUrl(req.receiptUrl())
                .depositedBy(req.depositedBy())
                .status(req.status())
                .build();
        var saved = repository.save(entity);
        log.info("Created daily closing deposit id={}", saved.getDailyClosingDepositId());
        return DailyClosingDepositResponse.from(saved);
    }

    @Transactional
    public DailyClosingDepositResponse update(Long id, UpdateDailyClosingDepositRequest req) {
        log.info("Updating daily closing deposit id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("DailyClosingDeposit not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.everydayClosingId() != null) entity.setEverydayClosingId(req.everydayClosingId());
        if (req.depositDate() != null) entity.setDepositDate(req.depositDate());
        if (req.bankAccountId() != null) entity.setBankAccountId(req.bankAccountId());
        if (req.amount() != null) entity.setAmount(req.amount());
        if (req.receiptUrl() != null) entity.setReceiptUrl(req.receiptUrl());
        if (req.depositedBy() != null) entity.setDepositedBy(req.depositedBy());
        if (req.status() != null) entity.setStatus(req.status());
        var saved = repository.save(entity);
        log.info("Updated daily closing deposit id={}", id);
        return DailyClosingDepositResponse.from(saved);
    }
}
