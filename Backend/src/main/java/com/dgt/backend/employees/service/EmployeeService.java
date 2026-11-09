package com.dgt.backend.employees.service;

import com.dgt.backend.employees.dto.EmployeeResponse;
import com.dgt.backend.employees.dto.CreateEmployeeRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeRequest;
import com.dgt.backend.employees.entity.Employee;
import com.dgt.backend.employees.repository.EmployeeRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA CRUD operations for Employee.
 * The caller is responsible for authorization and workflow validation; these queries add no store predicate.
 */

@Slf4j
@Service
public class EmployeeService {
    private final EmployeeRepository repository;
    public EmployeeService(EmployeeRepository repository) { this.repository = repository; }

    /** Load a page sorted by primary key and map its records to response DTOs. */
    public PageResponse<EmployeeResponse> list(int page, int size) {
        log.debug("Listing employee page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("employeeId")));
        log.debug("Employee list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(EmployeeResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load a record by ID or return HTTP 404. */
    public EmployeeResponse get(Long id) {
        log.debug("Fetching employee id={}", id);
        return EmployeeResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Employee not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
    @Transactional
    public EmployeeResponse create(CreateEmployeeRequest req) {
        log.info("Creating employee");
        var entity = Employee.builder()
                .hireDate(req.hireDate())
                .terminationDate(req.terminationDate())
                .employeeType(req.employeeType())
                .userId(req.userId())
                .build();
        var saved = repository.save(entity);
        log.info("Created employee id={}", saved.getEmployeeId());
        return EmployeeResponse.from(saved);
    }

    /** Apply only non-null fields in one transaction, leaving omitted fields unchanged. */
    @Transactional
    public EmployeeResponse update(Long id, UpdateEmployeeRequest req) {
        log.info("Updating employee id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Employee not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.hireDate() != null) entity.setHireDate(req.hireDate());
        if (req.terminationDate() != null) entity.setTerminationDate(req.terminationDate());
        if (req.employeeType() != null) entity.setEmployeeType(req.employeeType());
        if (req.userId() != null) entity.setUserId(req.userId());
        var saved = repository.save(entity);
        log.info("Updated employee id={}", id);
        return EmployeeResponse.from(saved);
    }
}
