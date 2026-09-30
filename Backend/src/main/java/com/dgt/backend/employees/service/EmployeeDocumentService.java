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

@Service
public class EmployeeDocumentService {
    private final EmployeeDocumentRepository repository;
    public EmployeeDocumentService(EmployeeDocumentRepository repository) { this.repository = repository; }

    public PageResponse<EmployeeDocumentResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("employeeDocumentId")));
        return new PageResponse<>(p.getContent().stream().map(EmployeeDocumentResponse::from).toList(), page, size, p.getTotalElements());
    }

    public EmployeeDocumentResponse get(Long id) {
        return EmployeeDocumentResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public EmployeeDocumentResponse create(CreateEmployeeDocumentRequest req) {
        var entity = EmployeeDocument.builder()
                .employeeId(req.employeeId())
                .documentType(req.documentType())
                .documentName(req.documentName())
                .documentUrl(req.documentUrl())
                .uploadedAt(req.uploadedAt())
                .build();
        return EmployeeDocumentResponse.from(repository.save(entity));
    }

    @Transactional
    public EmployeeDocumentResponse update(Long id, UpdateEmployeeDocumentRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.employeeId() != null) entity.setEmployeeId(req.employeeId());
        if (req.documentType() != null) entity.setDocumentType(req.documentType());
        if (req.documentName() != null) entity.setDocumentName(req.documentName());
        if (req.documentUrl() != null) entity.setDocumentUrl(req.documentUrl());
        if (req.uploadedAt() != null) entity.setUploadedAt(req.uploadedAt());
        return EmployeeDocumentResponse.from(repository.save(entity));
    }
}
