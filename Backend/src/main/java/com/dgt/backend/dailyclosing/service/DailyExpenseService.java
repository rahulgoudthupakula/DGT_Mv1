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

@Service
public class DailyExpenseService {
    private final DailyExpenseRepository repository;
    public DailyExpenseService(DailyExpenseRepository repository) { this.repository = repository; }

    public PageResponse<DailyExpenseResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("expensesId")));
        return new PageResponse<>(p.getContent().stream().map(DailyExpenseResponse::from).toList(), page, size, p.getTotalElements());
    }

    public DailyExpenseResponse get(Long id) {
        return DailyExpenseResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public DailyExpenseResponse create(CreateDailyExpenseRequest req) {
        var entity = DailyExpense.builder()
                .everydayClosingId(req.everydayClosingId())
                .expensesDate(req.expensesDate())
                .expensesType(req.expensesType())
                .description(req.description())
                .amount(req.amount())
                .paidBy(req.paidBy())
                .receiptNumber(req.receiptNumber())
                .build();
        return DailyExpenseResponse.from(repository.save(entity));
    }

    @Transactional
    public DailyExpenseResponse update(Long id, UpdateDailyExpenseRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.everydayClosingId() != null) entity.setEverydayClosingId(req.everydayClosingId());
        if (req.expensesDate() != null) entity.setExpensesDate(req.expensesDate());
        if (req.expensesType() != null) entity.setExpensesType(req.expensesType());
        if (req.description() != null) entity.setDescription(req.description());
        if (req.amount() != null) entity.setAmount(req.amount());
        if (req.paidBy() != null) entity.setPaidBy(req.paidBy());
        if (req.receiptNumber() != null) entity.setReceiptNumber(req.receiptNumber());
        return DailyExpenseResponse.from(repository.save(entity));
    }
}
