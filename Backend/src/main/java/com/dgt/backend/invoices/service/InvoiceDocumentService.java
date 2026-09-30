package com.dgt.backend.invoices.service;

import com.dgt.backend.invoices.dto.InvoiceDocumentResponse;
import com.dgt.backend.invoices.dto.CreateInvoiceDocumentRequest;
import com.dgt.backend.invoices.dto.UpdateInvoiceDocumentRequest;
import com.dgt.backend.invoices.entity.InvoiceDocument;
import com.dgt.backend.invoices.repository.InvoiceDocumentRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InvoiceDocumentService {
    private final InvoiceDocumentRepository repository;
    public InvoiceDocumentService(InvoiceDocumentRepository repository) { this.repository = repository; }

    public PageResponse<InvoiceDocumentResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("invoiceDocumentId")));
        return new PageResponse<>(p.getContent().stream().map(InvoiceDocumentResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InvoiceDocumentResponse get(Long id) {
        return InvoiceDocumentResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public InvoiceDocumentResponse create(CreateInvoiceDocumentRequest req) {
        var entity = InvoiceDocument.builder()
                .invoiceId(req.invoiceId())
                .documentType(req.documentType())
                .fileName(req.fileName())
                .fileUrl(req.fileUrl())
                .uploadedBy(req.uploadedBy())
                .uploadedAt(req.uploadedAt())
                .build();
        return InvoiceDocumentResponse.from(repository.save(entity));
    }

    @Transactional
    public InvoiceDocumentResponse update(Long id, UpdateInvoiceDocumentRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.invoiceId() != null) entity.setInvoiceId(req.invoiceId());
        if (req.documentType() != null) entity.setDocumentType(req.documentType());
        if (req.fileName() != null) entity.setFileName(req.fileName());
        if (req.fileUrl() != null) entity.setFileUrl(req.fileUrl());
        if (req.uploadedBy() != null) entity.setUploadedBy(req.uploadedBy());
        if (req.uploadedAt() != null) entity.setUploadedAt(req.uploadedAt());
        return InvoiceDocumentResponse.from(repository.save(entity));
    }
}
