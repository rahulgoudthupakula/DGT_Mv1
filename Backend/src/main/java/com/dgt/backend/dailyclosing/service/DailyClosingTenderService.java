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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DailyClosingTenderService {
    private final DailyClosingTenderRepository repository;
    public DailyClosingTenderService(DailyClosingTenderRepository repository) { this.repository = repository; }

    public PageResponse<DailyClosingTenderResponse> list(int page, int size) {
        log.debug("Listing daily closing tender page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("tenderId")));
        log.debug("DailyClosingTender list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(DailyClosingTenderResponse::from).toList(), page, size, p.getTotalElements());
    }

    public DailyClosingTenderResponse get(Long id) {
        log.debug("Fetching daily closing tender id={}", id);
        return DailyClosingTenderResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("DailyClosingTender not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public DailyClosingTenderResponse create(CreateDailyClosingTenderRequest req) {
        log.info("Creating daily closing tender");
        var entity = DailyClosingTender.builder()
                .everydayClosingId(req.everydayClosingId())
                .tenderType(req.tenderType())
                .expectedAmount(req.expectedAmount())
                .actualAmount(req.actualAmount())
                .amountDifference(req.amountDifference())
                .transactionCount(req.transactionCount())
                .build();
        var saved = repository.save(entity);
        log.info("Created daily closing tender id={}", saved.getDailyClosingTenderId());
        return DailyClosingTenderResponse.from(saved);
    }

    @Transactional
    public DailyClosingTenderResponse update(Long id, UpdateDailyClosingTenderRequest req) {
        log.info("Updating daily closing tender id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("DailyClosingTender not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.everydayClosingId() != null) entity.setEverydayClosingId(req.everydayClosingId());
        if (req.tenderType() != null) entity.setTenderType(req.tenderType());
        if (req.expectedAmount() != null) entity.setExpectedAmount(req.expectedAmount());
        if (req.actualAmount() != null) entity.setActualAmount(req.actualAmount());
        if (req.amountDifference() != null) entity.setAmountDifference(req.amountDifference());
        if (req.transactionCount() != null) entity.setTransactionCount(req.transactionCount());
        var saved = repository.save(entity);
        log.info("Updated daily closing tender id={}", id);
        return DailyClosingTenderResponse.from(saved);
    }
}
