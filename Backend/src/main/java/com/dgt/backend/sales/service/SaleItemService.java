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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SaleItemService {
    private final SaleItemRepository repository;
    public SaleItemService(SaleItemRepository repository) { this.repository = repository; }

    public PageResponse<SaleItemResponse> list(int page, int size) {
        log.debug("Listing sale item page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("salesItemId")));
        log.debug("SaleItem list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(SaleItemResponse::from).toList(), page, size, p.getTotalElements());
    }

    public SaleItemResponse get(Long id) {
        log.debug("Fetching sale item id={}", id);
        return SaleItemResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("SaleItem not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public SaleItemResponse create(CreateSaleItemRequest req) {
        log.info("Creating sale item");
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
        var saved = repository.save(entity);
        log.info("Created sale item id={}", saved.getSaleItemId());
        return SaleItemResponse.from(saved);
    }

    @Transactional
    public SaleItemResponse update(Long id, UpdateSaleItemRequest req) {
        log.info("Updating sale item id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("SaleItem not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
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
        var saved = repository.save(entity);
        log.info("Updated sale item id={}", id);
        return SaleItemResponse.from(saved);
    }
}
