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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
// Coordinate product price-group link persistence and response mapping; caller authorization is handled at the controller.
public class ProductPriceGroupService {
    private final ProductPriceGroupRepository repository;
    public ProductPriceGroupService(ProductPriceGroupRepository repository) { this.repository = repository; }

    // Read a page sorted by primary key and include the total record count.
    public PageResponse<ProductPriceGroupResponse> list(int page, int size) {
        log.debug("Listing product price group page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("productPriceGroupId")));
        log.debug("ProductPriceGroup list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(ProductPriceGroupResponse::from).toList(), page, size, p.getTotalElements());
    }

    // Map the stored record to the API response, or return HTTP 404 when absent.
    public ProductPriceGroupResponse get(Long id) {
        log.debug("Fetching product price group id={}", id);
        return ProductPriceGroupResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("ProductPriceGroup not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    // Build and save a record from the submitted create fields inside the transaction.
    public ProductPriceGroupResponse create(CreateProductPriceGroupRequest req) {
        log.info("Creating product price group");
        var entity = ProductPriceGroup.builder()
                .priceGroupId(req.priceGroupId())
                .productId(req.productId())
                .build();
        var saved = repository.save(entity);
        log.info("Created product price group id={}", saved.getProductPriceGroupId());
        return ProductPriceGroupResponse.from(saved);
    }

    @Transactional
    // Load the existing record and apply only non-null fields; null does not clear a stored value.
    public ProductPriceGroupResponse update(Long id, UpdateProductPriceGroupRequest req) {
        log.info("Updating product price group id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("ProductPriceGroup not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.priceGroupId() != null) entity.setPriceGroupId(req.priceGroupId());
        if (req.productId() != null) entity.setProductId(req.productId());
        var saved = repository.save(entity);
        log.info("Updated product price group id={}", id);
        return ProductPriceGroupResponse.from(saved);
    }
}
