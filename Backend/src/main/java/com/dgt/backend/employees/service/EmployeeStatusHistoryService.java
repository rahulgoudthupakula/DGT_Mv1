package com.dgt.backend.employees.service;

import com.dgt.backend.employees.dto.EmployeeStatusHistoryResponse;
import com.dgt.backend.employees.dto.CreateEmployeeStatusHistoryRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeStatusHistoryRequest;
import com.dgt.backend.employees.entity.EmployeeStatusHistory;
import com.dgt.backend.employees.repository.EmployeeStatusHistoryRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA CRUD operations for EmployeeStatusHistory.
 * The caller is responsible for authorization and workflow validation; these queries add no store predicate.
 */

@Slf4j
@Service
public class EmployeeStatusHistoryService {
    private final EmployeeStatusHistoryRepository repository;
    public EmployeeStatusHistoryService(EmployeeStatusHistoryRepository repository) { this.repository = repository; }

    /** Load a page sorted by primary key and map its records to response DTOs. */
    public PageResponse<EmployeeStatusHistoryResponse> list(int page, int size) {
        log.debug("Listing employee status history page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("statusHistoryId")));
        log.debug("EmployeeStatusHistory list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(EmployeeStatusHistoryResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load a record by ID or return HTTP 404. */
    public EmployeeStatusHistoryResponse get(Long id) {
        log.debug("Fetching employee status history id={}", id);
        return EmployeeStatusHistoryResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("EmployeeStatusHistory not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
    @Transactional
    public EmployeeStatusHistoryResponse create(CreateEmployeeStatusHistoryRequest req) {
        log.info("Creating employee status history");
        var entity = EmployeeStatusHistory.builder()
                .employeeId(req.employeeId())
                .status(req.status())
                .statusTypeId(req.statusTypeId())
                .build();
        var saved = repository.save(entity);
        log.info("Created employee status history id={}", saved.getStatusHistoryId());
        return EmployeeStatusHistoryResponse.from(saved);
    }

    /** Apply only non-null fields in one transaction, leaving omitted fields unchanged. */
    @Transactional
    public EmployeeStatusHistoryResponse update(Long id, UpdateEmployeeStatusHistoryRequest req) {
        log.info("Updating employee status history id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("EmployeeStatusHistory not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.employeeId() != null) entity.setEmployeeId(req.employeeId());
        if (req.status() != null) entity.setStatus(req.status());
        if (req.statusTypeId() != null) entity.setStatusTypeId(req.statusTypeId());
        var saved = repository.save(entity);
        log.info("Updated employee status history id={}", id);
        return EmployeeStatusHistoryResponse.from(saved);
    }
}
