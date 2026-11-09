package com.dgt.backend.departments.service;

import com.dgt.backend.departments.dto.DepartmentResponse;
import com.dgt.backend.departments.dto.CreateDepartmentRequest;
import com.dgt.backend.departments.dto.UpdateDepartmentRequest;
import com.dgt.backend.departments.entity.Department;
import com.dgt.backend.departments.repository.DepartmentRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA CRUD operations for Department.
 * The caller is responsible for authorization and workflow validation; these queries add no store predicate.
 */

@Slf4j
@Service
public class DepartmentService {
    private final DepartmentRepository repository;
    public DepartmentService(DepartmentRepository repository) { this.repository = repository; }

    /** Load a page sorted by primary key and map its records to response DTOs. */
    public PageResponse<DepartmentResponse> list(int page, int size) {
        log.debug("Listing department page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("departmentId")));
        log.debug("Department list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(DepartmentResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load a record by ID or return HTTP 404. */
    public DepartmentResponse get(Long id) {
        log.debug("Fetching department id={}", id);
        return DepartmentResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Department not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
    @Transactional
    public DepartmentResponse create(CreateDepartmentRequest req) {
        log.info("Creating department");
        var entity = Department.builder()
                .departmentName(req.departmentName())
                .isDefault(req.isDefault())
                .build();
        var saved = repository.save(entity);
        log.info("Created department id={}", saved.getDepartmentId());
        return DepartmentResponse.from(saved);
    }

    /** Apply only non-null fields in one transaction, leaving omitted fields unchanged. */
    @Transactional
    public DepartmentResponse update(Long id, UpdateDepartmentRequest req) {
        log.info("Updating department id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Department not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.departmentName() != null) entity.setDepartmentName(req.departmentName());
        if (req.isDefault() != null) entity.setIsDefault(req.isDefault());
        var saved = repository.save(entity);
        log.info("Updated department id={}", id);
        return DepartmentResponse.from(saved);
    }
}
