package com.dgt.backend.lottery.service;

import com.dgt.backend.lottery.dto.LotteryPackResponse;
import com.dgt.backend.lottery.dto.CreateLotteryPackRequest;
import com.dgt.backend.lottery.dto.UpdateLotteryPackRequest;
import com.dgt.backend.lottery.entity.LotteryPack;
import com.dgt.backend.lottery.repository.LotteryPackRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LotteryPackService {
    private final LotteryPackRepository repository;
    public LotteryPackService(LotteryPackRepository repository) { this.repository = repository; }

    public PageResponse<LotteryPackResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("lotteryPackId")));
        return new PageResponse<>(p.getContent().stream().map(LotteryPackResponse::from).toList(), page, size, p.getTotalElements());
    }

    public LotteryPackResponse get(Long id) {
        return LotteryPackResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public LotteryPackResponse create(CreateLotteryPackRequest req) {
        var entity = LotteryPack.builder()
                .invoiceId(req.invoiceId())
                .dgtId(req.dgtId())
                .vendorId(req.vendorId())
                .startTicketNumber(req.startTicketNumber())
                .endTicketNumber(req.endTicketNumber())
                .totalTickets(req.totalTickets())
                .statusId(req.statusId())
                .returnDate(req.returnDate())
                .performedBy(req.performedBy())
                .build();
        return LotteryPackResponse.from(repository.save(entity));
    }

    @Transactional
    public LotteryPackResponse update(Long id, UpdateLotteryPackRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.invoiceId() != null) entity.setInvoiceId(req.invoiceId());
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.vendorId() != null) entity.setVendorId(req.vendorId());
        if (req.startTicketNumber() != null) entity.setStartTicketNumber(req.startTicketNumber());
        if (req.endTicketNumber() != null) entity.setEndTicketNumber(req.endTicketNumber());
        if (req.totalTickets() != null) entity.setTotalTickets(req.totalTickets());
        if (req.statusId() != null) entity.setStatusId(req.statusId());
        if (req.returnDate() != null) entity.setReturnDate(req.returnDate());
        if (req.performedBy() != null) entity.setPerformedBy(req.performedBy());
        return LotteryPackResponse.from(repository.save(entity));
    }
}
