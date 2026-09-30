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

@Service
public class PromotionProductService {
    private final PromotionProductRepository repository;
    public PromotionProductService(PromotionProductRepository repository) { this.repository = repository; }

    public PageResponse<PromotionProductResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("promotionProductId")));
        return new PageResponse<>(p.getContent().stream().map(PromotionProductResponse::from).toList(), page, size, p.getTotalElements());
    }

    public PromotionProductResponse get(Long id) {
        return PromotionProductResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public PromotionProductResponse create(CreatePromotionProductRequest req) {
        var entity = PromotionProduct.builder()
                .promotionId(req.promotionId())
                .productId(req.productId())
                .build();
        return PromotionProductResponse.from(repository.save(entity));
    }

    @Transactional
    public PromotionProductResponse update(Long id, UpdatePromotionProductRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.promotionId() != null) entity.setPromotionId(req.promotionId());
        if (req.productId() != null) entity.setProductId(req.productId());
        return PromotionProductResponse.from(repository.save(entity));
    }
}
