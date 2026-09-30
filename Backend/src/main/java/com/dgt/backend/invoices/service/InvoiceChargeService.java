package com.dgt.backend.invoices.service;

import com.dgt.backend.invoices.dto.InvoiceChargeResponse;
import com.dgt.backend.invoices.dto.CreateInvoiceChargeRequest;
import com.dgt.backend.invoices.dto.UpdateInvoiceChargeRequest;
import com.dgt.backend.invoices.entity.InvoiceCharge;
import com.dgt.backend.invoices.repository.InvoiceChargeRepository;
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
public class InvoiceChargeService {
    private final InvoiceChargeRepository repository;
    public InvoiceChargeService(InvoiceChargeRepository repository) { this.repository = repository; }

    public PageResponse<InvoiceChargeResponse> list(int page, int size) {
        log.debug("Listing invoice charge page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("invoiceChargeId")));
        log.debug("InvoiceCharge list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(InvoiceChargeResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InvoiceChargeResponse get(Long id) {
        log.debug("Fetching invoice charge id={}", id);
        return InvoiceChargeResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InvoiceCharge not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public InvoiceChargeResponse create(CreateInvoiceChargeRequest req) {
        log.info("Creating invoice charge");
        var entity = InvoiceCharge.builder()
                .invoiceId(req.invoiceId())
                .chargeType(req.chargeType())
                .subTotal(req.subTotal())
                .discountedAmount(req.discountedAmount())
                .otherCharges(req.otherCharges())
                .totalAmount(req.totalAmount())
                .statusId(req.statusId())
                .paymentStatus(req.paymentStatus())
                .build();
        var saved = repository.save(entity);
        log.info("Created invoice charge id={}", saved.getInvoiceChargeId());
        return InvoiceChargeResponse.from(saved);
    }

    @Transactional
    public InvoiceChargeResponse update(Long id, UpdateInvoiceChargeRequest req) {
        log.info("Updating invoice charge id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InvoiceCharge not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.invoiceId() != null) entity.setInvoiceId(req.invoiceId());
        if (req.chargeType() != null) entity.setChargeType(req.chargeType());
        if (req.subTotal() != null) entity.setSubTotal(req.subTotal());
        if (req.discountedAmount() != null) entity.setDiscountedAmount(req.discountedAmount());
        if (req.otherCharges() != null) entity.setOtherCharges(req.otherCharges());
        if (req.totalAmount() != null) entity.setTotalAmount(req.totalAmount());
        if (req.statusId() != null) entity.setStatusId(req.statusId());
        if (req.paymentStatus() != null) entity.setPaymentStatus(req.paymentStatus());
        var saved = repository.save(entity);
        log.info("Updated invoice charge id={}", id);
        return InvoiceChargeResponse.from(saved);
    }
}
