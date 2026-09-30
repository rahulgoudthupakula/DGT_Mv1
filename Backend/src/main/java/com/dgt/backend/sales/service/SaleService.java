package com.dgt.backend.sales.service;

import com.dgt.backend.sales.dto.SaleResponse;
import com.dgt.backend.sales.dto.CreateSaleRequest;
import com.dgt.backend.sales.dto.UpdateSaleRequest;
import com.dgt.backend.sales.entity.Sale;
import com.dgt.backend.sales.repository.SaleRepository;
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
public class SaleService {
    private final SaleRepository repository;
    public SaleService(SaleRepository repository) { this.repository = repository; }

    public PageResponse<SaleResponse> list(int page, int size) {
        log.debug("Listing sale page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("saleId")));
        log.debug("Sale list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(SaleResponse::from).toList(), page, size, p.getTotalElements());
    }

    public SaleResponse get(Long id) {
        log.debug("Fetching sale id={}", id);
        return SaleResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Sale not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public SaleResponse create(CreateSaleRequest req) {
        log.info("Creating sale");
        var entity = Sale.builder()
                .storeId(req.storeId())
                .cashierId(req.cashierId())
                .terminalId(req.terminalId())
                .receiptNo(req.receiptNo())
                .transactionId(req.transactionId())
                .transactionType(req.transactionType())
                .saleStatus(req.saleStatus())
                .saleDatetime(req.saleDatetime())
                .subtotal(req.subtotal())
                .taxableAmount(req.taxableAmount())
                .taxAmount(req.taxAmount())
                .discountAmount(req.discountAmount())
                .totalAmount(req.totalAmount())
                .totalItems(req.totalItems())
                .build();
        var saved = repository.save(entity);
        log.info("Created sale id={}", saved.getSaleId());
        return SaleResponse.from(saved);
    }

    @Transactional
    public SaleResponse update(Long id, UpdateSaleRequest req) {
        log.info("Updating sale id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Sale not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.storeId() != null) entity.setStoreId(req.storeId());
        if (req.cashierId() != null) entity.setCashierId(req.cashierId());
        if (req.terminalId() != null) entity.setTerminalId(req.terminalId());
        if (req.receiptNo() != null) entity.setReceiptNo(req.receiptNo());
        if (req.transactionId() != null) entity.setTransactionId(req.transactionId());
        if (req.transactionType() != null) entity.setTransactionType(req.transactionType());
        if (req.saleStatus() != null) entity.setSaleStatus(req.saleStatus());
        if (req.saleDatetime() != null) entity.setSaleDatetime(req.saleDatetime());
        if (req.subtotal() != null) entity.setSubtotal(req.subtotal());
        if (req.taxableAmount() != null) entity.setTaxableAmount(req.taxableAmount());
        if (req.taxAmount() != null) entity.setTaxAmount(req.taxAmount());
        if (req.discountAmount() != null) entity.setDiscountAmount(req.discountAmount());
        if (req.totalAmount() != null) entity.setTotalAmount(req.totalAmount());
        if (req.totalItems() != null) entity.setTotalItems(req.totalItems());
        var saved = repository.save(entity);
        log.info("Updated sale id={}", id);
        return SaleResponse.from(saved);
    }
}
