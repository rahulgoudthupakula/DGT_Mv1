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
import lombok.extern.slf4j.Slf4j;

/**
 * JPA CRUD operations for StoreDepartment.
 * The caller is responsible for authorization and workflow validation; these queries add no store predicate.
 */

@Slf4j
@Service
public class StoreDepartmentService {
    private final StoreDepartmentRepository repository;
    public StoreDepartmentService(StoreDepartmentRepository repository) { this.repository = repository; }

    /** Load a page sorted by primary key and map its records to response DTOs. */
    public PageResponse<StoreDepartmentResponse> list(int page, int size) {
        log.debug("Listing store department page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("storeDepartmentId")));
        log.debug("StoreDepartment list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(StoreDepartmentResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load a record by ID or return HTTP 404. */
    public StoreDepartmentResponse get(Long id) {
        log.debug("Fetching store department id={}", id);
        return StoreDepartmentResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("StoreDepartment not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
    @Transactional
    public StoreDepartmentResponse create(CreateStoreDepartmentRequest req) {
        log.info("Creating store department");
        var entity = StoreDepartment.builder()
                .dgtId(req.dgtId())
                .departmentId(req.departmentId())
                .storeDepartmentName(req.storeDepartmentName())
                .isActive(req.isActive())
                .sourceType(req.sourceType())
                .build();
        var saved = repository.save(entity);
        log.info("Created store department id={}", saved.getStoreDepartmentId());
        return StoreDepartmentResponse.from(saved);
    }

    /** Apply only non-null fields in one transaction, leaving omitted fields unchanged. */
    @Transactional
    public StoreDepartmentResponse update(Long id, UpdateStoreDepartmentRequest req) {
        log.info("Updating store department id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("StoreDepartment not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.departmentId() != null) entity.setDepartmentId(req.departmentId());
        if (req.storeDepartmentName() != null) entity.setStoreDepartmentName(req.storeDepartmentName());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        if (req.sourceType() != null) entity.setSourceType(req.sourceType());
        var saved = repository.save(entity);
        log.info("Updated store department id={}", id);
        return StoreDepartmentResponse.from(saved);
    }
}
