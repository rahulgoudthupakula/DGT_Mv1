package com.dgt.backend.productstoreprices.service;

import com.dgt.backend.productstoreprices.dto.ProductStorePriceResponse;
import com.dgt.backend.productstoreprices.dto.CreateProductStorePriceRequest;
import com.dgt.backend.productstoreprices.dto.UpdateProductStorePriceRequest;
import com.dgt.backend.productstoreprices.entity.ProductStorePrice;
import com.dgt.backend.productstoreprices.repository.ProductStorePriceRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductStorePriceService {
    private final ProductStorePriceRepository repository;
    public ProductStorePriceService(ProductStorePriceRepository repository) { this.repository = repository; }

    public PageResponse<ProductStorePriceResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("storePriceId")));
        return new PageResponse<>(p.getContent().stream().map(ProductStorePriceResponse::from).toList(), page, size, p.getTotalElements());
    }

    public ProductStorePriceResponse get(Long id) {
        return ProductStorePriceResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public ProductStorePriceResponse create(CreateProductStorePriceRequest req) {
        var entity = ProductStorePrice.builder()
                .dgtId(req.dgtId())
                .productId(req.productId())
                .retailPrice(req.retailPrice())
                .isActive(req.isActive())
                .rebateId(req.rebateId())
                .build();
        return ProductStorePriceResponse.from(repository.save(entity));
    }

    @Transactional
    public ProductStorePriceResponse update(Long id, UpdateProductStorePriceRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.retailPrice() != null) entity.setRetailPrice(req.retailPrice());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        if (req.rebateId() != null) entity.setRebateId(req.rebateId());
        return ProductStorePriceResponse.from(repository.save(entity));
    }
}
