package com.dgt.backend.invoices.service;

import com.dgt.backend.invoices.dto.InvoiceAuditLogResponse;
import com.dgt.backend.invoices.dto.CreateInvoiceAuditLogRequest;
import com.dgt.backend.invoices.dto.UpdateInvoiceAuditLogRequest;
import com.dgt.backend.invoices.entity.InvoiceAuditLog;
import com.dgt.backend.invoices.repository.InvoiceAuditLogRepository;
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
public class InvoiceAuditLogService {
    private final InvoiceAuditLogRepository repository;
    public InvoiceAuditLogService(InvoiceAuditLogRepository repository) { this.repository = repository; }

    public PageResponse<InvoiceAuditLogResponse> list(int page, int size) {
        log.debug("Listing invoice audit log page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("invoiceAuditLogId")));
        log.debug("InvoiceAuditLog list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(InvoiceAuditLogResponse::from).toList(), page, size, p.getTotalElements());
    }

    public InvoiceAuditLogResponse get(Long id) {
        log.debug("Fetching invoice audit log id={}", id);
        return InvoiceAuditLogResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InvoiceAuditLog not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public InvoiceAuditLogResponse create(CreateInvoiceAuditLogRequest req) {
        log.info("Creating invoice audit log");
        var entity = InvoiceAuditLog.builder()
                .invoiceId(req.invoiceId())
                .actionType(req.actionType())
                .actionBy(req.actionBy())
                .oldValue(req.oldValue())
                .newValue(req.newValue())
                .build();
        var saved = repository.save(entity);
        log.info("Created invoice audit log id={}", saved.getInvoiceAuditLogId());
        return InvoiceAuditLogResponse.from(saved);
    }

    @Transactional
    public InvoiceAuditLogResponse update(Long id, UpdateInvoiceAuditLogRequest req) {
        log.info("Updating invoice audit log id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("InvoiceAuditLog not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.invoiceId() != null) entity.setInvoiceId(req.invoiceId());
        if (req.actionType() != null) entity.setActionType(req.actionType());
        if (req.actionBy() != null) entity.setActionBy(req.actionBy());
        if (req.oldValue() != null) entity.setOldValue(req.oldValue());
        if (req.newValue() != null) entity.setNewValue(req.newValue());
        var saved = repository.save(entity);
        log.info("Updated invoice audit log id={}", id);
        return InvoiceAuditLogResponse.from(saved);
    }
}
