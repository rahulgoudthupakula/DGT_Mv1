package com.dgt.backend.products.service;

import com.dgt.backend.products.dto.ProductResponse;
import com.dgt.backend.products.dto.CreateProductRequest;
import com.dgt.backend.products.dto.UpdateProductRequest;
import com.dgt.backend.products.entity.Product;
import com.dgt.backend.products.repository.ProductRepository;
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
public class ProductService {
    private final ProductRepository repository;
    public ProductService(ProductRepository repository) { this.repository = repository; }

    public PageResponse<ProductResponse> list(int page, int size) {
        log.debug("Listing product page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("productId")));
        log.debug("Product list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(ProductResponse::from).toList(), page, size, p.getTotalElements());
    }

    public ProductResponse get(Long id) {
        log.debug("Fetching product id={}", id);
        return ProductResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Product not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public ProductResponse create(CreateProductRequest req) {
        log.info("Creating product");
        var entity = Product.builder()
                .storeSubDepartmentId(req.storeSubDepartmentId())
                .productName(req.productName())
                .productSku(req.productSku())
                .isReturnable(req.isReturnable())
                .brandId(req.brandId())
                .unitOfMeasure(req.unitOfMeasure())
                .isActive(req.isActive())
                .isTaxable(req.isTaxable())
                .isEbt(req.isEbt())
                .build();
        var saved = repository.save(entity);
        log.info("Created product id={}", saved.getProductId());
        return ProductResponse.from(saved);
    }

    @Transactional
    public ProductResponse update(Long id, UpdateProductRequest req) {
        log.info("Updating product id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Product not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.storeSubDepartmentId() != null) entity.setStoreSubDepartmentId(req.storeSubDepartmentId());
        if (req.productName() != null) entity.setProductName(req.productName());
        if (req.productSku() != null) entity.setProductSku(req.productSku());
        if (req.isReturnable() != null) entity.setIsReturnable(req.isReturnable());
        if (req.brandId() != null) entity.setBrandId(req.brandId());
        if (req.unitOfMeasure() != null) entity.setUnitOfMeasure(req.unitOfMeasure());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        if (req.isTaxable() != null) entity.setIsTaxable(req.isTaxable());
        if (req.isEbt() != null) entity.setIsEbt(req.isEbt());
        var saved = repository.save(entity);
        log.info("Updated product id={}", id);
        return ProductResponse.from(saved);
    }
}
