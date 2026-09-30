package com.dgt.backend.invoices.service;

import com.dgt.backend.invoices.dto.InvoiceResponse;
import com.dgt.backend.invoices.dto.CreateInvoiceRequest;
import com.dgt.backend.invoices.dto.UpdateInvoiceRequest;
import com.dgt.backend.invoices.entity.Invoice;
import com.dgt.backend.invoices.repository.InvoiceRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InvoiceService {
    private final InvoiceRepository repository;
    public InvoiceService(InvoiceRepository repository) { this.repository = repository; }

    public PageResponse<InvoiceResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("invoiceId")));
        return new PageResponse<>(p.getContent().stream().map(InvoiceResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InvoiceResponse get(Long id) {
        return InvoiceResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public InvoiceResponse create(CreateInvoiceRequest req) {
        var entity = Invoice.builder()
                .dgtId(req.dgtId())
                .vendorId(req.vendorId())
                .invoiceNumber(req.invoiceNumber())
                .invoiceType(req.invoiceType())
                .invoiceDate(req.invoiceDate())
                .receivedDate(req.receivedDate())
                .dueDate(req.dueDate())
                .receivedBy(req.receivedBy())
                .approvedBy(req.approvedBy())
                .approvedAt(req.approvedAt())
                .purchaseOrderId(req.purchaseOrderId())
                .build();
        return InvoiceResponse.from(repository.save(entity));
    }

    @Transactional
    public InvoiceResponse update(Long id, UpdateInvoiceRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.vendorId() != null) entity.setVendorId(req.vendorId());
        if (req.invoiceNumber() != null) entity.setInvoiceNumber(req.invoiceNumber());
        if (req.invoiceType() != null) entity.setInvoiceType(req.invoiceType());
        if (req.invoiceDate() != null) entity.setInvoiceDate(req.invoiceDate());
        if (req.receivedDate() != null) entity.setReceivedDate(req.receivedDate());
        if (req.dueDate() != null) entity.setDueDate(req.dueDate());
        if (req.receivedBy() != null) entity.setReceivedBy(req.receivedBy());
        if (req.approvedBy() != null) entity.setApprovedBy(req.approvedBy());
        if (req.approvedAt() != null) entity.setApprovedAt(req.approvedAt());
        if (req.purchaseOrderId() != null) entity.setPurchaseOrderId(req.purchaseOrderId());
        return InvoiceResponse.from(repository.save(entity));
    }
}
