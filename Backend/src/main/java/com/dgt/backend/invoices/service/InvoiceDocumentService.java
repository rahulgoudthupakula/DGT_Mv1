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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class InvoiceDocumentService {
    private final InvoiceDocumentRepository repository;
    public InvoiceDocumentService(InvoiceDocumentRepository repository) { this.repository = repository; }

    public PageResponse<InvoiceDocumentResponse> list(int page, int size) {
        log.debug("Listing invoice document page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("invoiceDocumentId")));
        log.debug("InvoiceDocument list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(InvoiceDocumentResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InvoiceDocumentResponse get(Long id) {
        log.debug("Fetching invoice document id={}", id);
        return InvoiceDocumentResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InvoiceDocument not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public InvoiceDocumentResponse create(CreateInvoiceDocumentRequest req) {
        log.info("Creating invoice document");
        var entity = InvoiceDocument.builder()
                .invoiceId(req.invoiceId())
                .documentType(req.documentType())
                .fileName(req.fileName())
                .fileUrl(req.fileUrl())
                .uploadedBy(req.uploadedBy())
                .uploadedAt(req.uploadedAt())
                .build();
        var saved = repository.save(entity);
        log.info("Created invoice document id={}", saved.getInvoiceDocumentId());
        return InvoiceDocumentResponse.from(saved);
    }

    @Transactional
    public InvoiceDocumentResponse update(Long id, UpdateInvoiceDocumentRequest req) {
        log.info("Updating invoice document id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InvoiceDocument not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.invoiceId() != null) entity.setInvoiceId(req.invoiceId());
        if (req.documentType() != null) entity.setDocumentType(req.documentType());
        if (req.fileName() != null) entity.setFileName(req.fileName());
        if (req.fileUrl() != null) entity.setFileUrl(req.fileUrl());
        if (req.uploadedBy() != null) entity.setUploadedBy(req.uploadedBy());
        if (req.uploadedAt() != null) entity.setUploadedAt(req.uploadedAt());
        var saved = repository.save(entity);
        log.info("Updated invoice document id={}", id);
        return InvoiceDocumentResponse.from(saved);
    }
}
