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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class LotteryPackService {
    private final LotteryPackRepository repository;
    public LotteryPackService(LotteryPackRepository repository) { this.repository = repository; }

    public PageResponse<LotteryPackResponse> list(int page, int size) {
        log.debug("Listing lottery pack page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("lotteryPackId")));
        log.debug("LotteryPack list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(LotteryPackResponse::from).toList(), page, size, p.getTotalElements());
    }

    public LotteryPackResponse get(Long id) {
        log.debug("Fetching lottery pack id={}", id);
        return LotteryPackResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("LotteryPack not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public LotteryPackResponse create(CreateLotteryPackRequest req) {
        log.info("Creating lottery pack");
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
        var saved = repository.save(entity);
        log.info("Created lottery pack id={}", saved.getLotteryPackId());
        return LotteryPackResponse.from(saved);
    }

    @Transactional
    public LotteryPackResponse update(Long id, UpdateLotteryPackRequest req) {
        log.info("Updating lottery pack id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("LotteryPack not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.invoiceId() != null) entity.setInvoiceId(req.invoiceId());
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.vendorId() != null) entity.setVendorId(req.vendorId());
        if (req.startTicketNumber() != null) entity.setStartTicketNumber(req.startTicketNumber());
        if (req.endTicketNumber() != null) entity.setEndTicketNumber(req.endTicketNumber());
        if (req.totalTickets() != null) entity.setTotalTickets(req.totalTickets());
        if (req.statusId() != null) entity.setStatusId(req.statusId());
        if (req.returnDate() != null) entity.setReturnDate(req.returnDate());
        if (req.performedBy() != null) entity.setPerformedBy(req.performedBy());
        var saved = repository.save(entity);
        log.info("Updated lottery pack id={}", id);
        return LotteryPackResponse.from(saved);
    }
}
