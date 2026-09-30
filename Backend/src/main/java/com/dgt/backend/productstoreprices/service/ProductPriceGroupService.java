package com.dgt.backend.productstoreprices.service;

import com.dgt.backend.productstoreprices.dto.ProductPriceGroupResponse;
import com.dgt.backend.productstoreprices.dto.CreateProductPriceGroupRequest;
import com.dgt.backend.productstoreprices.dto.UpdateProductPriceGroupRequest;
import com.dgt.backend.productstoreprices.entity.ProductPriceGroup;
import com.dgt.backend.productstoreprices.repository.ProductPriceGroupRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductPriceGroupService {
    private final ProductPriceGroupRepository repository;
    public ProductPriceGroupService(ProductPriceGroupRepository repository) { this.repository = repository; }

    public PageResponse<ProductPriceGroupResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("productPriceGroupId")));
        return new PageResponse<>(p.getContent().stream().map(ProductPriceGroupResponse::from).toList(), page, size, p.getTotalElements());
    }

    public ProductPriceGroupResponse get(Long id) {
        return ProductPriceGroupResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public ProductPriceGroupResponse create(CreateProductPriceGroupRequest req) {
        var entity = ProductPriceGroup.builder()
                .priceGroupId(req.priceGroupId())
                .productId(req.productId())
                .build();
        return ProductPriceGroupResponse.from(repository.save(entity));
    }

    @Transactional
    public ProductPriceGroupResponse update(Long id, UpdateProductPriceGroupRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.priceGroupId() != null) entity.setPriceGroupId(req.priceGroupId());
        if (req.productId() != null) entity.setProductId(req.productId());
        return ProductPriceGroupResponse.from(repository.save(entity));
    }
}
