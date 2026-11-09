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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
// Coordinate product store price persistence and response mapping; caller authorization is handled at the controller.
public class ProductStorePriceService {
    private final ProductStorePriceRepository repository;
    public ProductStorePriceService(ProductStorePriceRepository repository) { this.repository = repository; }

    // Read a page sorted by primary key and include the total record count.
    public PageResponse<ProductStorePriceResponse> list(int page, int size) {
        log.debug("Listing product store price page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("storePriceId")));
        log.debug("ProductStorePrice list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(ProductStorePriceResponse::from).toList(), page, size, p.getTotalElements());
    }

    // Map the stored record to the API response, or return HTTP 404 when absent.
    public ProductStorePriceResponse get(Long id) {
        log.debug("Fetching product store price id={}", id);
        return ProductStorePriceResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("ProductStorePrice not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    // Build and save a record from the submitted create fields inside the transaction.
    public ProductStorePriceResponse create(CreateProductStorePriceRequest req) {
        log.info("Creating product store price");
        var entity = ProductStorePrice.builder()
                .dgtId(req.dgtId())
                .productId(req.productId())
                .retailPrice(req.retailPrice())
                .isActive(req.isActive())
                .rebateId(req.rebateId())
                .build();
        var saved = repository.save(entity);
        log.info("Created product store price id={}", saved.getStorePriceId());
        return ProductStorePriceResponse.from(saved);
    }

    @Transactional
    // Load the existing record and apply only non-null fields; null does not clear a stored value.
    public ProductStorePriceResponse update(Long id, UpdateProductStorePriceRequest req) {
        log.info("Updating product store price id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("ProductStorePrice not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.retailPrice() != null) entity.setRetailPrice(req.retailPrice());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        if (req.rebateId() != null) entity.setRebateId(req.rebateId());
        var saved = repository.save(entity);
        log.info("Updated product store price id={}", id);
        return ProductStorePriceResponse.from(saved);
    }
}
