package com.dgt.backend.sales.service;

import com.dgt.backend.sales.dto.SaleItemResponse;
import com.dgt.backend.sales.dto.CreateSaleItemRequest;
import com.dgt.backend.sales.dto.UpdateSaleItemRequest;
import com.dgt.backend.sales.entity.SaleItem;
import com.dgt.backend.sales.repository.SaleItemRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SaleItemService {
    private final SaleItemRepository repository;
    public SaleItemService(SaleItemRepository repository) { this.repository = repository; }

    public PageResponse<SaleItemResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("salesItemId")));
        return new PageResponse<>(p.getContent().stream().map(SaleItemResponse::from).toList(), page, size, p.getTotalElements());
    }

    public SaleItemResponse get(Long id) {
        return SaleItemResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public SaleItemResponse create(CreateSaleItemRequest req) {
        var entity = SaleItem.builder()
                .saleId(req.saleId())
                .productId(req.productId())
                .quantity(req.quantity())
                .catalogPrice(req.catalogPrice())
                .unitPrice(req.unitPrice())
                .grossAmount(req.grossAmount())
                .discountAmount(req.discountAmount())
                .taxableAmount(req.taxableAmount())
                .taxAmount(req.taxAmount())
                .lineTotal(req.lineTotal())
                .build();
        return SaleItemResponse.from(repository.save(entity));
    }

    @Transactional
    public SaleItemResponse update(Long id, UpdateSaleItemRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.saleId() != null) entity.setSaleId(req.saleId());
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.quantity() != null) entity.setQuantity(req.quantity());
        if (req.catalogPrice() != null) entity.setCatalogPrice(req.catalogPrice());
        if (req.unitPrice() != null) entity.setUnitPrice(req.unitPrice());
        if (req.grossAmount() != null) entity.setGrossAmount(req.grossAmount());
        if (req.discountAmount() != null) entity.setDiscountAmount(req.discountAmount());
        if (req.taxableAmount() != null) entity.setTaxableAmount(req.taxableAmount());
        if (req.taxAmount() != null) entity.setTaxAmount(req.taxAmount());
        if (req.lineTotal() != null) entity.setLineTotal(req.lineTotal());
        return SaleItemResponse.from(repository.save(entity));
    }
}
