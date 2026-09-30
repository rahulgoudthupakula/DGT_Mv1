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

@Service
public class InvoiceChargeService {
    private final InvoiceChargeRepository repository;
    public InvoiceChargeService(InvoiceChargeRepository repository) { this.repository = repository; }

    public PageResponse<InvoiceChargeResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("invoiceChargeId")));
        return new PageResponse<>(p.getContent().stream().map(InvoiceChargeResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InvoiceChargeResponse get(Long id) {
        return InvoiceChargeResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public InvoiceChargeResponse create(CreateInvoiceChargeRequest req) {
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
        return InvoiceChargeResponse.from(repository.save(entity));
    }

    @Transactional
    public InvoiceChargeResponse update(Long id, UpdateInvoiceChargeRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.invoiceId() != null) entity.setInvoiceId(req.invoiceId());
        if (req.chargeType() != null) entity.setChargeType(req.chargeType());
        if (req.subTotal() != null) entity.setSubTotal(req.subTotal());
        if (req.discountedAmount() != null) entity.setDiscountedAmount(req.discountedAmount());
        if (req.otherCharges() != null) entity.setOtherCharges(req.otherCharges());
        if (req.totalAmount() != null) entity.setTotalAmount(req.totalAmount());
        if (req.statusId() != null) entity.setStatusId(req.statusId());
        if (req.paymentStatus() != null) entity.setPaymentStatus(req.paymentStatus());
        return InvoiceChargeResponse.from(repository.save(entity));
    }
}
