package com.dgt.backend.billing.service;

import com.dgt.backend.billing.dto.BillingInvoiceResponse;
import com.dgt.backend.billing.dto.CreateBillingInvoiceRequest;
import com.dgt.backend.billing.dto.UpdateBillingInvoiceRequest;
import com.dgt.backend.billing.entity.BillingInvoice;
import com.dgt.backend.billing.repository.BillingInvoiceRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA CRUD operations for BillingInvoice records.
 * Authorization is applied by the controller; these repository calls do not add store filtering.
 * Renewal and plan-change calculations belong to StoreBilling.
 */

@Slf4j
@Service
public class BillingInvoiceService {
    private final BillingInvoiceRepository repository;
    public BillingInvoiceService(BillingInvoiceRepository repository) { this.repository = repository; }

    /** Read a page sorted by the primary key and map entities to response DTOs. */
    public PageResponse<BillingInvoiceResponse> list(int page, int size) {
        log.debug("Listing billing invoice page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("invoiceId")));
        log.debug("BillingInvoice list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(BillingInvoiceResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load one record or return HTTP 404 when the identifier is unknown. */
    public BillingInvoiceResponse get(Long id) {
        log.debug("Fetching billing invoice id={}", id);
        return BillingInvoiceResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("BillingInvoice not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
    @Transactional
    public BillingInvoiceResponse create(CreateBillingInvoiceRequest req) {
        log.info("Creating billing invoice");
        var entity = BillingInvoice.builder()
                .storeId(req.storeId())
                .subscriptionPlanId(req.subscriptionPlanId())
                .invoiceNumber(req.invoiceNumber())
                .invoiceDate(req.invoiceDate())
                .periodStart(req.periodStart())
                .periodEnd(req.periodEnd())
                .subtotal(req.subtotal())
                .taxAmount(req.taxAmount())
                .totalAmount(req.totalAmount())
                .dgtInvoiceStatus(req.dgtInvoiceStatus())
                .paidAt(req.paidAt())
                .invoiceDocumentUrl(req.invoiceDocumentUrl())
                .build();
        var saved = repository.save(entity);
        log.info("Created billing invoice id={}", saved.getInvoiceId());
        return BillingInvoiceResponse.from(saved);
    }

    /** Update only non-null request fields in one transaction; omitted fields stay unchanged. */
    @Transactional
    public BillingInvoiceResponse update(Long id, UpdateBillingInvoiceRequest req) {
        log.info("Updating billing invoice id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("BillingInvoice not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.storeId() != null) entity.setStoreId(req.storeId());
        if (req.subscriptionPlanId() != null) entity.setSubscriptionPlanId(req.subscriptionPlanId());
        if (req.invoiceNumber() != null) entity.setInvoiceNumber(req.invoiceNumber());
        if (req.invoiceDate() != null) entity.setInvoiceDate(req.invoiceDate());
        if (req.periodStart() != null) entity.setPeriodStart(req.periodStart());
        if (req.periodEnd() != null) entity.setPeriodEnd(req.periodEnd());
        if (req.subtotal() != null) entity.setSubtotal(req.subtotal());
        if (req.taxAmount() != null) entity.setTaxAmount(req.taxAmount());
        if (req.totalAmount() != null) entity.setTotalAmount(req.totalAmount());
        if (req.dgtInvoiceStatus() != null) entity.setDgtInvoiceStatus(req.dgtInvoiceStatus());
        if (req.paidAt() != null) entity.setPaidAt(req.paidAt());
        if (req.invoiceDocumentUrl() != null) entity.setInvoiceDocumentUrl(req.invoiceDocumentUrl());
        var saved = repository.save(entity);
        log.info("Updated billing invoice id={}", id);
        return BillingInvoiceResponse.from(saved);
    }
}
