package com.dgt.backend.promotions.service;

import com.dgt.backend.promotions.dto.PromotionResponse;
import com.dgt.backend.promotions.dto.CreatePromotionRequest;
import com.dgt.backend.promotions.dto.UpdatePromotionRequest;
import com.dgt.backend.promotions.entity.Promotion;
import com.dgt.backend.promotions.repository.PromotionRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PromotionService {
    private final PromotionRepository repository;
    public PromotionService(PromotionRepository repository) { this.repository = repository; }

    public PageResponse<PromotionResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("promotionId")));
        return new PageResponse<>(p.getContent().stream().map(PromotionResponse::from).toList(), page, size, p.getTotalElements());
    }

    public PromotionResponse get(Long id) {
        return PromotionResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public PromotionResponse create(CreatePromotionRequest req) {
        var entity = Promotion.builder()
                .dgtId(req.dgtId())
                .promotionName(req.promotionName())
                .promotionType(req.promotionType())
                .startDate(req.startDate())
                .endDate(req.endDate())
                .status(req.status())
                .discountValue(req.discountValue())
                .build();
        return PromotionResponse.from(repository.save(entity));
    }

    @Transactional
    public PromotionResponse update(Long id, UpdatePromotionRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.promotionName() != null) entity.setPromotionName(req.promotionName());
        if (req.promotionType() != null) entity.setPromotionType(req.promotionType());
        if (req.startDate() != null) entity.setStartDate(req.startDate());
        if (req.endDate() != null) entity.setEndDate(req.endDate());
        if (req.status() != null) entity.setStatus(req.status());
        if (req.discountValue() != null) entity.setDiscountValue(req.discountValue());
        return PromotionResponse.from(repository.save(entity));
    }
}
