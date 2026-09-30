package com.dgt.backend.dailyclosing.service;

import com.dgt.backend.dailyclosing.dto.DailyClosingTenderResponse;
import com.dgt.backend.dailyclosing.dto.CreateDailyClosingTenderRequest;
import com.dgt.backend.dailyclosing.dto.UpdateDailyClosingTenderRequest;
import com.dgt.backend.dailyclosing.entity.DailyClosingTender;
import com.dgt.backend.dailyclosing.repository.DailyClosingTenderRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DailyClosingTenderService {
    private final DailyClosingTenderRepository repository;
    public DailyClosingTenderService(DailyClosingTenderRepository repository) { this.repository = repository; }

    public PageResponse<DailyClosingTenderResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("tenderId")));
        return new PageResponse<>(p.getContent().stream().map(DailyClosingTenderResponse::from).toList(), page, size, p.getTotalElements());
    }

    public DailyClosingTenderResponse get(Long id) {
        return DailyClosingTenderResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public DailyClosingTenderResponse create(CreateDailyClosingTenderRequest req) {
        var entity = DailyClosingTender.builder()
                .everydayClosingId(req.everydayClosingId())
                .tenderType(req.tenderType())
                .expectedAmount(req.expectedAmount())
                .actualAmount(req.actualAmount())
                .amountDifference(req.amountDifference())
                .transactionCount(req.transactionCount())
                .build();
        return DailyClosingTenderResponse.from(repository.save(entity));
    }

    @Transactional
    public DailyClosingTenderResponse update(Long id, UpdateDailyClosingTenderRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.everydayClosingId() != null) entity.setEverydayClosingId(req.everydayClosingId());
        if (req.tenderType() != null) entity.setTenderType(req.tenderType());
        if (req.expectedAmount() != null) entity.setExpectedAmount(req.expectedAmount());
        if (req.actualAmount() != null) entity.setActualAmount(req.actualAmount());
        if (req.amountDifference() != null) entity.setAmountDifference(req.amountDifference());
        if (req.transactionCount() != null) entity.setTransactionCount(req.transactionCount());
        return DailyClosingTenderResponse.from(repository.save(entity));
    }
}
