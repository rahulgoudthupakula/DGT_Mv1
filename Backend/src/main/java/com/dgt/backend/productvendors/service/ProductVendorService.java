package com.dgt.backend.productvendors.service;

import com.dgt.backend.productvendors.dto.ProductVendorResponse;
import com.dgt.backend.productvendors.dto.CreateProductVendorRequest;
import com.dgt.backend.productvendors.dto.UpdateProductVendorRequest;
import com.dgt.backend.productvendors.entity.ProductVendor;
import com.dgt.backend.productvendors.repository.ProductVendorRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductVendorService {
    private final ProductVendorRepository repository;
    public ProductVendorService(ProductVendorRepository repository) { this.repository = repository; }

    public PageResponse<ProductVendorResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("productVendorId")));
        return new PageResponse<>(p.getContent().stream().map(ProductVendorResponse::from).toList(), page, size, p.getTotalElements());
    }

    public ProductVendorResponse get(Long id) {
        return ProductVendorResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public ProductVendorResponse create(CreateProductVendorRequest req) {
        var entity = ProductVendor.builder()
                .productId(req.productId())
                .vendorId(req.vendorId())
                .vendorSku(req.vendorSku())
                .unitType(req.unitType())
                .unitOfMeasure(req.unitOfMeasure())
                .unitCost(req.unitCost())
                .isPrimary(req.isPrimary())
                .build();
        return ProductVendorResponse.from(repository.save(entity));
    }

    @Transactional
    public ProductVendorResponse update(Long id, UpdateProductVendorRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.vendorId() != null) entity.setVendorId(req.vendorId());
        if (req.vendorSku() != null) entity.setVendorSku(req.vendorSku());
        if (req.unitType() != null) entity.setUnitType(req.unitType());
        if (req.unitOfMeasure() != null) entity.setUnitOfMeasure(req.unitOfMeasure());
        if (req.unitCost() != null) entity.setUnitCost(req.unitCost());
        if (req.isPrimary() != null) entity.setIsPrimary(req.isPrimary());
        return ProductVendorResponse.from(repository.save(entity));
    }
}
