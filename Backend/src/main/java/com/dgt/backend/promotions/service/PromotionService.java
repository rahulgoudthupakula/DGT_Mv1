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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class PromotionService {
    private final PromotionRepository repository;
    public PromotionService(PromotionRepository repository) { this.repository = repository; }

    public PageResponse<PromotionResponse> list(int page, int size) {
        log.debug("Listing promotion page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("promotionId")));
        log.debug("Promotion list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(PromotionResponse::from).toList(), page, size, p.getTotalElements());
    }

    public PromotionResponse get(Long id) {
        log.debug("Fetching promotion id={}", id);
        return PromotionResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Promotion not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public PromotionResponse create(CreatePromotionRequest req) {
        log.info("Creating promotion");
        var entity = Promotion.builder()
                .dgtId(req.dgtId())
                .promotionName(req.promotionName())
                .promotionType(req.promotionType())
                .startDate(req.startDate())
                .endDate(req.endDate())
                .status(req.status())
                .discountValue(req.discountValue())
                .build();
        var saved = repository.save(entity);
        log.info("Created promotion id={}", saved.getPromotionId());
        return PromotionResponse.from(saved);
    }

    @Transactional
    public PromotionResponse update(Long id, UpdatePromotionRequest req) {
        log.info("Updating promotion id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Promotion not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.promotionName() != null) entity.setPromotionName(req.promotionName());
        if (req.promotionType() != null) entity.setPromotionType(req.promotionType());
        if (req.startDate() != null) entity.setStartDate(req.startDate());
        if (req.endDate() != null) entity.setEndDate(req.endDate());
        if (req.status() != null) entity.setStatus(req.status());
        if (req.discountValue() != null) entity.setDiscountValue(req.discountValue());
        var saved = repository.save(entity);
        log.info("Updated promotion id={}", id);
        return PromotionResponse.from(saved);
    }
}
