package com.dgt.backend.lottery.service;

import com.dgt.backend.lottery.dto.LotterySettingResponse;
import com.dgt.backend.lottery.dto.CreateLotterySettingRequest;
import com.dgt.backend.lottery.dto.UpdateLotterySettingRequest;
import com.dgt.backend.lottery.entity.LotterySetting;
import com.dgt.backend.lottery.repository.LotterySettingRepository;
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
public class LotterySettingService {
    private final LotterySettingRepository repository;
    public LotterySettingService(LotterySettingRepository repository) { this.repository = repository; }

    public PageResponse<LotterySettingResponse> list(int page, int size) {
        log.debug("Listing lottery setting page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("lotterySettingId")));
        log.debug("LotterySetting list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(LotterySettingResponse::from).toList(), page, size, p.getTotalElements());
    }

    public LotterySettingResponse get(Long id) {
        log.debug("Fetching lottery setting id={}", id);
        return LotterySettingResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("LotterySetting not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public LotterySettingResponse create(CreateLotterySettingRequest req) {
        log.info("Creating lottery setting");
        var entity = LotterySetting.builder()
                .dgtId(req.dgtId())
                .maxOpenPacksPerGame(req.maxOpenPacksPerGame())
                .allowPartialReturns(req.allowPartialReturns())
                .defaultCommissionPerPack(req.defaultCommissionPerPack())
                .settlementFrequency(req.settlementFrequency())
                .build();
        var saved = repository.save(entity);
        log.info("Created lottery setting id={}", saved.getLotterySettingId());
        return LotterySettingResponse.from(saved);
    }

    @Transactional
    public LotterySettingResponse update(Long id, UpdateLotterySettingRequest req) {
        log.info("Updating lottery setting id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("LotterySetting not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.maxOpenPacksPerGame() != null) entity.setMaxOpenPacksPerGame(req.maxOpenPacksPerGame());
        if (req.allowPartialReturns() != null) entity.setAllowPartialReturns(req.allowPartialReturns());
        if (req.defaultCommissionPerPack() != null) entity.setDefaultCommissionPerPack(req.defaultCommissionPerPack());
        if (req.settlementFrequency() != null) entity.setSettlementFrequency(req.settlementFrequency());
        var saved = repository.save(entity);
        log.info("Updated lottery setting id={}", id);
        return LotterySettingResponse.from(saved);
    }
}
