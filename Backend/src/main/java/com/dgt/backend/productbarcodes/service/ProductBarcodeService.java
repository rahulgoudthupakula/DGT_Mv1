package com.dgt.backend.productbarcodes.service;

import com.dgt.backend.productbarcodes.dto.ProductBarcodeResponse;
import com.dgt.backend.productbarcodes.dto.CreateProductBarcodeRequest;
import com.dgt.backend.productbarcodes.dto.UpdateProductBarcodeRequest;
import com.dgt.backend.productbarcodes.entity.ProductBarcode;
import com.dgt.backend.productbarcodes.repository.ProductBarcodeRepository;
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
// Coordinate product barcode persistence and response mapping; caller authorization is handled at the controller.
public class ProductBarcodeService {
    private final ProductBarcodeRepository repository;
    public ProductBarcodeService(ProductBarcodeRepository repository) { this.repository = repository; }

    // Read a page sorted by primary key and include the total record count.
    public PageResponse<ProductBarcodeResponse> list(int page, int size) {
        log.debug("Listing product barcode page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("productBarcodeId")));
        log.debug("ProductBarcode list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(ProductBarcodeResponse::from).toList(), page, size, p.getTotalElements());
    }

    // Map the stored record to the API response, or return HTTP 404 when absent.
    public ProductBarcodeResponse get(Long id) {
        log.debug("Fetching product barcode id={}", id);
        return ProductBarcodeResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("ProductBarcode not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    // Build and save a record from the submitted create fields inside the transaction.
    public ProductBarcodeResponse create(CreateProductBarcodeRequest req) {
        log.info("Creating product barcode");
        var entity = ProductBarcode.builder()
                .productId(req.productId())
                .productBarcodeType(req.productBarcodeType())
                .productBarcodeValue(req.productBarcodeValue())
                .isPrimary(req.isPrimary())
                .build();
        var saved = repository.save(entity);
        log.info("Created product barcode id={}", saved.getProductBarcodeId());
        return ProductBarcodeResponse.from(saved);
    }

    @Transactional
    // Load the existing record and apply only non-null fields; null does not clear a stored value.
    public ProductBarcodeResponse update(Long id, UpdateProductBarcodeRequest req) {
        log.info("Updating product barcode id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("ProductBarcode not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.productBarcodeType() != null) entity.setProductBarcodeType(req.productBarcodeType());
        if (req.productBarcodeValue() != null) entity.setProductBarcodeValue(req.productBarcodeValue());
        if (req.isPrimary() != null) entity.setIsPrimary(req.isPrimary());
        var saved = repository.save(entity);
        log.info("Updated product barcode id={}", id);
        return ProductBarcodeResponse.from(saved);
    }
}
