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

@Service
public class InvoiceAdjustmentService {
    private final InvoiceAdjustmentRepository repository;
    public InvoiceAdjustmentService(InvoiceAdjustmentRepository repository) { this.repository = repository; }

    public PageResponse<InvoiceAdjustmentResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("invoiceAdjustmentId")));
        return new PageResponse<>(p.getContent().stream().map(InvoiceAdjustmentResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InvoiceAdjustmentResponse get(Long id) {
        return InvoiceAdjustmentResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public InvoiceAdjustmentResponse create(CreateInvoiceAdjustmentRequest req) {
        var entity = InvoiceAdjustment.builder()
                .invoiceId(req.invoiceId())
                .adjustmentType(req.adjustmentType())
                .adjustedAmount(req.adjustedAmount())
                .reason(req.reason())
                .build();
        return InvoiceAdjustmentResponse.from(repository.save(entity));
    }

    @Transactional
    public InvoiceAdjustmentResponse update(Long id, UpdateInvoiceAdjustmentRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.invoiceId() != null) entity.setInvoiceId(req.invoiceId());
        if (req.adjustmentType() != null) entity.setAdjustmentType(req.adjustmentType());
        if (req.adjustedAmount() != null) entity.setAdjustedAmount(req.adjustedAmount());
        if (req.reason() != null) entity.setReason(req.reason());
        return InvoiceAdjustmentResponse.from(repository.save(entity));
    }
}
