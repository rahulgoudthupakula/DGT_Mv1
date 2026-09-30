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

@Service
public class DailyClosingDepositService {
    private final DailyClosingDepositRepository repository;
    public DailyClosingDepositService(DailyClosingDepositRepository repository) { this.repository = repository; }

    public PageResponse<DailyClosingDepositResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("depositId")));
        return new PageResponse<>(p.getContent().stream().map(DailyClosingDepositResponse::from).toList(), page, size, p.getTotalElements());
    }

    public DailyClosingDepositResponse get(Long id) {
        return DailyClosingDepositResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public DailyClosingDepositResponse create(CreateDailyClosingDepositRequest req) {
        var entity = DailyClosingDeposit.builder()
                .everydayClosingId(req.everydayClosingId())
                .depositDate(req.depositDate())
                .bankAccountId(req.bankAccountId())
                .amount(req.amount())
                .receiptUrl(req.receiptUrl())
                .depositedBy(req.depositedBy())
                .status(req.status())
                .build();
        return DailyClosingDepositResponse.from(repository.save(entity));
    }

    @Transactional
    public DailyClosingDepositResponse update(Long id, UpdateDailyClosingDepositRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.everydayClosingId() != null) entity.setEverydayClosingId(req.everydayClosingId());
        if (req.depositDate() != null) entity.setDepositDate(req.depositDate());
        if (req.bankAccountId() != null) entity.setBankAccountId(req.bankAccountId());
        if (req.amount() != null) entity.setAmount(req.amount());
        if (req.receiptUrl() != null) entity.setReceiptUrl(req.receiptUrl());
        if (req.depositedBy() != null) entity.setDepositedBy(req.depositedBy());
        if (req.status() != null) entity.setStatus(req.status());
        return DailyClosingDepositResponse.from(repository.save(entity));
    }
}
