package com.dgt.backend.lottery.service;

import com.dgt.backend.lottery.dto.LotteryPackInventoryResponse;
import com.dgt.backend.lottery.dto.CreateLotteryPackInventoryRequest;
import com.dgt.backend.lottery.dto.UpdateLotteryPackInventoryRequest;
import com.dgt.backend.lottery.entity.LotteryPackInventory;
import com.dgt.backend.lottery.repository.LotteryPackInventoryRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LotteryPackInventoryService {
    private final LotteryPackInventoryRepository repository;
    public LotteryPackInventoryService(LotteryPackInventoryRepository repository) { this.repository = repository; }

    public PageResponse<LotteryPackInventoryResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("lotteryPackInventoryId")));
        return new PageResponse<>(p.getContent().stream().map(LotteryPackInventoryResponse::from).toList(), page, size, p.getTotalElements());
    }

    public LotteryPackInventoryResponse get(Long id) {
        return LotteryPackInventoryResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public LotteryPackInventoryResponse create(CreateLotteryPackInventoryRequest req) {
        var entity = LotteryPackInventory.builder()
                .dgtId(req.dgtId())
                .shiftOpenedBy(req.shiftOpenedBy())
                .shiftOpenedAt(req.shiftOpenedAt())
                .shiftClosedAt(req.shiftClosedAt())
                .build();
        return LotteryPackInventoryResponse.from(repository.save(entity));
    }

    @Transactional
    public LotteryPackInventoryResponse update(Long id, UpdateLotteryPackInventoryRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.shiftOpenedBy() != null) entity.setShiftOpenedBy(req.shiftOpenedBy());
        if (req.shiftOpenedAt() != null) entity.setShiftOpenedAt(req.shiftOpenedAt());
        if (req.shiftClosedAt() != null) entity.setShiftClosedAt(req.shiftClosedAt());
        return LotteryPackInventoryResponse.from(repository.save(entity));
    }
}
