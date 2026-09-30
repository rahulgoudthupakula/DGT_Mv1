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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class LotteryGameService {
    private final LotteryGameRepository repository;
    public LotteryGameService(LotteryGameRepository repository) { this.repository = repository; }

    public PageResponse<LotteryGameResponse> list(int page, int size) {
        log.debug("Listing lottery game page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("lotteryGameId")));
        log.debug("LotteryGame list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(LotteryGameResponse::from).toList(), page, size, p.getTotalElements());
    }

    public LotteryGameResponse get(Long id) {
        log.debug("Fetching lottery game id={}", id);
        return LotteryGameResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("LotteryGame not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public LotteryGameResponse create(CreateLotteryGameRequest req) {
        log.info("Creating lottery game");
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
        var saved = repository.save(entity);
        log.info("Created lottery game id={}", saved.getLotteryGameId());
        return LotteryGameResponse.from(saved);
    }

    @Transactional
    public LotteryGameResponse update(Long id, UpdateLotteryGameRequest req) {
        log.info("Updating lottery game id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("LotteryGame not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
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
        var saved = repository.save(entity);
        log.info("Updated lottery game id={}", id);
        return LotteryGameResponse.from(saved);
    }
}
