package com.dgt.backend.lottery.service;

import com.dgt.backend.lottery.dto.LotteryGameResponse;
import com.dgt.backend.lottery.dto.CreateLotteryGameRequest;
import com.dgt.backend.lottery.dto.UpdateLotteryGameRequest;
import com.dgt.backend.lottery.entity.LotteryGame;
import com.dgt.backend.lottery.repository.LotteryGameRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LotteryGameService {
    private final LotteryGameRepository repository;
    public LotteryGameService(LotteryGameRepository repository) { this.repository = repository; }

    public PageResponse<LotteryGameResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("lotteryGameId")));
        return new PageResponse<>(p.getContent().stream().map(LotteryGameResponse::from).toList(), page, size, p.getTotalElements());
    }

    public LotteryGameResponse get(Long id) {
        return LotteryGameResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public LotteryGameResponse create(CreateLotteryGameRequest req) {
        var entity = LotteryGame.builder()
                .dgtId(req.dgtId())
                .gameCode(req.gameCode())
                .gameName(req.gameName())
                .ticketPrice(req.ticketPrice())
                .ticketsPerPack(req.ticketsPerPack())
                .packValue(req.packValue())
                .commissionPercent(req.commissionPercent())
                .status(req.status())
                .packNumber(req.packNumber())
                .barcode(req.barcode())
                .build();
        return LotteryGameResponse.from(repository.save(entity));
    }

    @Transactional
    public LotteryGameResponse update(Long id, UpdateLotteryGameRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.gameCode() != null) entity.setGameCode(req.gameCode());
        if (req.gameName() != null) entity.setGameName(req.gameName());
        if (req.ticketPrice() != null) entity.setTicketPrice(req.ticketPrice());
        if (req.ticketsPerPack() != null) entity.setTicketsPerPack(req.ticketsPerPack());
        if (req.packValue() != null) entity.setPackValue(req.packValue());
        if (req.commissionPercent() != null) entity.setCommissionPercent(req.commissionPercent());
        if (req.status() != null) entity.setStatus(req.status());
        if (req.packNumber() != null) entity.setPackNumber(req.packNumber());
        if (req.barcode() != null) entity.setBarcode(req.barcode());
        return LotteryGameResponse.from(repository.save(entity));
    }
}
