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

@Service
public class ProductBarcodeService {
    private final ProductBarcodeRepository repository;
    public ProductBarcodeService(ProductBarcodeRepository repository) { this.repository = repository; }

    public PageResponse<ProductBarcodeResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("productBarcodeId")));
        return new PageResponse<>(p.getContent().stream().map(ProductBarcodeResponse::from).toList(), page, size, p.getTotalElements());
    }

    public ProductBarcodeResponse get(Long id) {
        return ProductBarcodeResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public ProductBarcodeResponse create(CreateProductBarcodeRequest req) {
        var entity = ProductBarcode.builder()
                .productId(req.productId())
                .productBarcodeType(req.productBarcodeType())
                .productBarcodeValue(req.productBarcodeValue())
                .isPrimary(req.isPrimary())
                .build();
        return ProductBarcodeResponse.from(repository.save(entity));
    }

    @Transactional
    public ProductBarcodeResponse update(Long id, UpdateProductBarcodeRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.productBarcodeType() != null) entity.setProductBarcodeType(req.productBarcodeType());
        if (req.productBarcodeValue() != null) entity.setProductBarcodeValue(req.productBarcodeValue());
        if (req.isPrimary() != null) entity.setIsPrimary(req.isPrimary());
        return ProductBarcodeResponse.from(repository.save(entity));
    }
}
