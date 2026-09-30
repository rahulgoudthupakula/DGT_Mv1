package com.dgt.backend.employees.service;

import com.dgt.backend.employees.dto.EmployeeDocumentResponse;
import com.dgt.backend.employees.dto.CreateEmployeeDocumentRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeDocumentRequest;
import com.dgt.backend.employees.entity.EmployeeDocument;
import com.dgt.backend.employees.repository.EmployeeDocumentRepository;
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
public class EmployeeDocumentService {
    private final EmployeeDocumentRepository repository;
    public EmployeeDocumentService(EmployeeDocumentRepository repository) { this.repository = repository; }

    public PageResponse<EmployeeDocumentResponse> list(int page, int size) {
        log.debug("Listing employee document page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("employeeDocumentId")));
        log.debug("EmployeeDocument list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(EmployeeDocumentResponse::from).toList(), page, size, p.getTotalElements());
    }

    public EmployeeDocumentResponse get(Long id) {
        log.debug("Fetching employee document id={}", id);
        return EmployeeDocumentResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("EmployeeDocument not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public EmployeeDocumentResponse create(CreateEmployeeDocumentRequest req) {
        log.info("Creating employee document");
        var entity = EmployeeDocument.builder()
                .employeeId(req.employeeId())
                .documentType(req.documentType())
                .documentName(req.documentName())
                .documentUrl(req.documentUrl())
                .uploadedAt(req.uploadedAt())
                .build();
        var saved = repository.save(entity);
        log.info("Created employee document id={}", saved.getEmployeeDocumentId());
        return EmployeeDocumentResponse.from(saved);
    }

    @Transactional
    public EmployeeDocumentResponse update(Long id, UpdateEmployeeDocumentRequest req) {
        log.info("Updating employee document id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("EmployeeDocument not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.employeeId() != null) entity.setEmployeeId(req.employeeId());
        if (req.documentType() != null) entity.setDocumentType(req.documentType());
        if (req.documentName() != null) entity.setDocumentName(req.documentName());
        if (req.documentUrl() != null) entity.setDocumentUrl(req.documentUrl());
        if (req.uploadedAt() != null) entity.setUploadedAt(req.uploadedAt());
        var saved = repository.save(entity);
        log.info("Updated employee document id={}", id);
        return EmployeeDocumentResponse.from(saved);
    }
}
