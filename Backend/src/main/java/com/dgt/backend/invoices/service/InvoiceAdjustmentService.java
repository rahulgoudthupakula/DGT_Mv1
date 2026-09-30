package com.dgt.backend.invoices.service;

import com.dgt.backend.invoices.dto.InvoiceAdjustmentResponse;
import com.dgt.backend.invoices.dto.CreateInvoiceAdjustmentRequest;
import com.dgt.backend.invoices.dto.UpdateInvoiceAdjustmentRequest;
import com.dgt.backend.invoices.entity.InvoiceAdjustment;
import com.dgt.backend.invoices.repository.InvoiceAdjustmentRepository;
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
public class InvoiceAdjustmentService {
    private final InvoiceAdjustmentRepository repository;
    public InvoiceAdjustmentService(InvoiceAdjustmentRepository repository) { this.repository = repository; }

    public PageResponse<InvoiceAdjustmentResponse> list(int page, int size) {
        log.debug("Listing invoice adjustment page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("invoiceAdjustmentId")));
        log.debug("InvoiceAdjustment list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(InvoiceAdjustmentResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InvoiceAdjustmentResponse get(Long id) {
        log.debug("Fetching invoice adjustment id={}", id);
        return InvoiceAdjustmentResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InvoiceAdjustment not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public InvoiceAdjustmentResponse create(CreateInvoiceAdjustmentRequest req) {
        log.info("Creating invoice adjustment");
        var entity = InvoiceAdjustment.builder()
                .invoiceId(req.invoiceId())
                .adjustmentType(req.adjustmentType())
                .adjustedAmount(req.adjustedAmount())
                .reason(req.reason())
                .build();
        var saved = repository.save(entity);
        log.info("Created invoice adjustment id={}", saved.getInvoiceAdjustmentId());
        return InvoiceAdjustmentResponse.from(saved);
    }

    @Transactional
    public InvoiceAdjustmentResponse update(Long id, UpdateInvoiceAdjustmentRequest req) {
        log.info("Updating invoice adjustment id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InvoiceAdjustment not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.invoiceId() != null) entity.setInvoiceId(req.invoiceId());
        if (req.adjustmentType() != null) entity.setAdjustmentType(req.adjustmentType());
        if (req.adjustedAmount() != null) entity.setAdjustedAmount(req.adjustedAmount());
        if (req.reason() != null) entity.setReason(req.reason());
        var saved = repository.save(entity);
        log.info("Updated invoice adjustment id={}", id);
        return InvoiceAdjustmentResponse.from(saved);
    }
}
