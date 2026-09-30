package com.dgt.backend.departments.service;

import com.dgt.backend.departments.dto.StoreDepartmentResponse;
import com.dgt.backend.departments.dto.CreateStoreDepartmentRequest;
import com.dgt.backend.departments.dto.UpdateStoreDepartmentRequest;
import com.dgt.backend.departments.entity.StoreDepartment;
import com.dgt.backend.departments.repository.StoreDepartmentRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StoreDepartmentService {
    private final StoreDepartmentRepository repository;
    public StoreDepartmentService(StoreDepartmentRepository repository) { this.repository = repository; }

    public PageResponse<StoreDepartmentResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("storeDepartmentId")));
        return new PageResponse<>(p.getContent().stream().map(StoreDepartmentResponse::from).toList(), page, size, p.getTotalElements());
    }

    public StoreDepartmentResponse get(Long id) {
        return StoreDepartmentResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public StoreDepartmentResponse create(CreateStoreDepartmentRequest req) {
        var entity = StoreDepartment.builder()
                .dgtId(req.dgtId())
                .departmentId(req.departmentId())
                .storeDepartmentName(req.storeDepartmentName())
                .isActive(req.isActive())
                .sourceType(req.sourceType())
                .build();
        return StoreDepartmentResponse.from(repository.save(entity));
    }

    @Transactional
    public StoreDepartmentResponse update(Long id, UpdateStoreDepartmentRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.departmentId() != null) entity.setDepartmentId(req.departmentId());
        if (req.storeDepartmentName() != null) entity.setStoreDepartmentName(req.storeDepartmentName());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        if (req.sourceType() != null) entity.setSourceType(req.sourceType());
        return StoreDepartmentResponse.from(repository.save(entity));
    }
}
