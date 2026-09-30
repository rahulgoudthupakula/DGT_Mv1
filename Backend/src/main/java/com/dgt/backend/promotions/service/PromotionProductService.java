package com.dgt.backend.promotions.service;

import com.dgt.backend.promotions.dto.PromotionProductResponse;
import com.dgt.backend.promotions.dto.CreatePromotionProductRequest;
import com.dgt.backend.promotions.dto.UpdatePromotionProductRequest;
import com.dgt.backend.promotions.entity.PromotionProduct;
import com.dgt.backend.promotions.repository.PromotionProductRepository;
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
public class PromotionProductService {
    private final PromotionProductRepository repository;
    public PromotionProductService(PromotionProductRepository repository) { this.repository = repository; }

    public PageResponse<PromotionProductResponse> list(int page, int size) {
        log.debug("Listing promotion product page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("promotionProductId")));
        log.debug("PromotionProduct list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(PromotionProductResponse::from).toList(), page, size, p.getTotalElements());
    }

    public PromotionProductResponse get(Long id) {
        log.debug("Fetching promotion product id={}", id);
        return PromotionProductResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("PromotionProduct not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public PromotionProductResponse create(CreatePromotionProductRequest req) {
        log.info("Creating promotion product");
        var entity = PromotionProduct.builder()
                .promotionId(req.promotionId())
                .productId(req.productId())
                .build();
        var saved = repository.save(entity);
        log.info("Created promotion product id={}", saved.getPromotionProductId());
        return PromotionProductResponse.from(saved);
    }

    @Transactional
    public PromotionProductResponse update(Long id, UpdatePromotionProductRequest req) {
        log.info("Updating promotion product id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("PromotionProduct not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.promotionId() != null) entity.setPromotionId(req.promotionId());
        if (req.productId() != null) entity.setProductId(req.productId());
        var saved = repository.save(entity);
        log.info("Updated promotion product id={}", id);
        return PromotionProductResponse.from(saved);
    }
}
