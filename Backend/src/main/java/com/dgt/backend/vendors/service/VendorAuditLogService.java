package com.dgt.backend.vendors.service;

import com.dgt.backend.vendors.dto.VendorAuditLogResponse;
import com.dgt.backend.vendors.dto.CreateVendorAuditLogRequest;
import com.dgt.backend.vendors.dto.UpdateVendorAuditLogRequest;
import com.dgt.backend.vendors.entity.VendorAuditLog;
import com.dgt.backend.vendors.repository.VendorAuditLogRepository;
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
public class VendorAuditLogService {
    private final VendorAuditLogRepository repository;
    public VendorAuditLogService(VendorAuditLogRepository repository) { this.repository = repository; }

    public PageResponse<VendorAuditLogResponse> list(int page, int size) {
        log.debug("Listing vendor audit log page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("auditId")));
        log.debug("VendorAuditLog list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(VendorAuditLogResponse::from).toList(), page, size, p.getTotalElements());
    }

    public VendorAuditLogResponse get(Long id) {
        log.debug("Fetching vendor audit log id={}", id);
        return VendorAuditLogResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("VendorAuditLog not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public VendorAuditLogResponse create(CreateVendorAuditLogRequest req) {
        log.info("Creating vendor audit log");
        var entity = VendorAuditLog.builder()
                .vendorId(req.vendorId())
                .productId(req.productId())
                .dgtId(req.dgtId())
                .actionType(req.actionType())
                .details(req.details())
                .costHistoryId(req.costHistoryId())
                .build();
        var saved = repository.save(entity);
        log.info("Created vendor audit log id={}", saved.getVendorAuditLogId());
        return VendorAuditLogResponse.from(saved);
    }

    @Transactional
    public VendorAuditLogResponse update(Long id, UpdateVendorAuditLogRequest req) {
        log.info("Updating vendor audit log id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("VendorAuditLog not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.vendorId() != null) entity.setVendorId(req.vendorId());
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.actionType() != null) entity.setActionType(req.actionType());
        if (req.details() != null) entity.setDetails(req.details());
        if (req.costHistoryId() != null) entity.setCostHistoryId(req.costHistoryId());
        var saved = repository.save(entity);
        log.info("Updated vendor audit log id={}", id);
        return VendorAuditLogResponse.from(saved);
    }
}
