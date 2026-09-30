package com.dgt.backend.lottery.service;

import com.dgt.backend.lottery.dto.LotteryPackInventoryItemResponse;
import com.dgt.backend.lottery.dto.CreateLotteryPackInventoryItemRequest;
import com.dgt.backend.lottery.dto.UpdateLotteryPackInventoryItemRequest;
import com.dgt.backend.lottery.entity.LotteryPackInventoryItem;
import com.dgt.backend.lottery.repository.LotteryPackInventoryItemRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LotteryPackInventoryItemService {
    private final LotteryPackInventoryItemRepository repository;
    public LotteryPackInventoryItemService(LotteryPackInventoryItemRepository repository) { this.repository = repository; }

    public PageResponse<LotteryPackInventoryItemResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("lotteryPackInventoryItemId")));
        return new PageResponse<>(p.getContent().stream().map(LotteryPackInventoryItemResponse::from).toList(), page, size, p.getTotalElements());
    }

    public LotteryPackInventoryItemResponse get(Long id) {
        return LotteryPackInventoryItemResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public LotteryPackInventoryItemResponse create(CreateLotteryPackInventoryItemRequest req) {
        var entity = LotteryPackInventoryItem.builder()
                .lotteryPackInventoryId(req.lotteryPackInventoryId())
                .openTicketNumber(req.openTicketNumber())
                .lastSoldTicketNumber(req.lastSoldTicketNumber())
                .physicalQuantity(req.physicalQuantity())
                .packId(req.packId())
                .commissionAmount(req.commissionAmount())
                .expectedCash(req.expectedCash())
                .build();
        return LotteryPackInventoryItemResponse.from(repository.save(entity));
    }

    @Transactional
    public LotteryPackInventoryItemResponse update(Long id, UpdateLotteryPackInventoryItemRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.lotteryPackInventoryId() != null) entity.setLotteryPackInventoryId(req.lotteryPackInventoryId());
        if (req.openTicketNumber() != null) entity.setOpenTicketNumber(req.openTicketNumber());
        if (req.lastSoldTicketNumber() != null) entity.setLastSoldTicketNumber(req.lastSoldTicketNumber());
        if (req.physicalQuantity() != null) entity.setPhysicalQuantity(req.physicalQuantity());
        if (req.packId() != null) entity.setPackId(req.packId());
        if (req.commissionAmount() != null) entity.setCommissionAmount(req.commissionAmount());
        if (req.expectedCash() != null) entity.setExpectedCash(req.expectedCash());
        return LotteryPackInventoryItemResponse.from(repository.save(entity));
    }
}
