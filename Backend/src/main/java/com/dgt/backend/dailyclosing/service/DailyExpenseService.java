package com.dgt.backend.dailyclosing.service;

import com.dgt.backend.dailyclosing.dto.DailyExpenseResponse;
import com.dgt.backend.dailyclosing.dto.CreateDailyExpenseRequest;
import com.dgt.backend.dailyclosing.dto.UpdateDailyExpenseRequest;
import com.dgt.backend.dailyclosing.entity.DailyExpense;
import com.dgt.backend.dailyclosing.repository.DailyExpenseRepository;
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
public class DailyExpenseService {
    private final DailyExpenseRepository repository;
    public DailyExpenseService(DailyExpenseRepository repository) { this.repository = repository; }

    public PageResponse<DailyExpenseResponse> list(int page, int size) {
        log.debug("Listing daily expense page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("expensesId")));
        log.debug("DailyExpense list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(DailyExpenseResponse::from).toList(), page, size, p.getTotalElements());
    }

    public DailyExpenseResponse get(Long id) {
        log.debug("Fetching daily expense id={}", id);
        return DailyExpenseResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("DailyExpense not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public DailyExpenseResponse create(CreateDailyExpenseRequest req) {
        log.info("Creating daily expense");
        var entity = DailyExpense.builder()
                .everydayClosingId(req.everydayClosingId())
                .expensesDate(req.expensesDate())
                .expensesType(req.expensesType())
                .description(req.description())
                .amount(req.amount())
                .paidBy(req.paidBy())
                .receiptNumber(req.receiptNumber())
                .build();
        var saved = repository.save(entity);
        log.info("Created daily expense id={}", saved.getDailyExpenseId());
        return DailyExpenseResponse.from(saved);
    }

    @Transactional
    public DailyExpenseResponse update(Long id, UpdateDailyExpenseRequest req) {
        log.info("Updating daily expense id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("DailyExpense not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.everydayClosingId() != null) entity.setEverydayClosingId(req.everydayClosingId());
        if (req.expensesDate() != null) entity.setExpensesDate(req.expensesDate());
        if (req.expensesType() != null) entity.setExpensesType(req.expensesType());
        if (req.description() != null) entity.setDescription(req.description());
        if (req.amount() != null) entity.setAmount(req.amount());
        if (req.paidBy() != null) entity.setPaidBy(req.paidBy());
        if (req.receiptNumber() != null) entity.setReceiptNumber(req.receiptNumber());
        var saved = repository.save(entity);
        log.info("Updated daily expense id={}", id);
        return DailyExpenseResponse.from(saved);
    }
}
