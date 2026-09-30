package com.dgt.backend.employees.service;

import com.dgt.backend.employees.dto.EmployeeStoreAssignmentResponse;
import com.dgt.backend.employees.dto.CreateEmployeeStoreAssignmentRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeStoreAssignmentRequest;
import com.dgt.backend.employees.entity.EmployeeStoreAssignment;
import com.dgt.backend.employees.repository.EmployeeStoreAssignmentRepository;
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
public class EmployeeStoreAssignmentService {
    private final EmployeeStoreAssignmentRepository repository;
    public EmployeeStoreAssignmentService(EmployeeStoreAssignmentRepository repository) { this.repository = repository; }

    public PageResponse<EmployeeStoreAssignmentResponse> list(int page, int size) {
        log.debug("Listing employee store assignment page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("employeeStoreAssignmentId")));
        log.debug("EmployeeStoreAssignment list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(EmployeeStoreAssignmentResponse::from).toList(), page, size, p.getTotalElements());
    }

    public EmployeeStoreAssignmentResponse get(Long id) {
        log.debug("Fetching employee store assignment id={}", id);
        return EmployeeStoreAssignmentResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("EmployeeStoreAssignment not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public EmployeeStoreAssignmentResponse create(CreateEmployeeStoreAssignmentRequest req) {
        log.info("Creating employee store assignment");
        var entity = EmployeeStoreAssignment.builder()
                .employeeId(req.employeeId())
                .dgtId(req.dgtId())
                .isPrimary(req.isPrimary())
                .effectiveFrom(req.effectiveFrom())
                .effectiveTo(req.effectiveTo())
                .roleTypeId(req.roleTypeId())
                .build();
        var saved = repository.save(entity);
        log.info("Created employee store assignment id={}", saved.getEmployeeStoreAssignmentId());
        return EmployeeStoreAssignmentResponse.from(saved);
    }

    @Transactional
    public EmployeeStoreAssignmentResponse update(Long id, UpdateEmployeeStoreAssignmentRequest req) {
        log.info("Updating employee store assignment id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("EmployeeStoreAssignment not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.employeeId() != null) entity.setEmployeeId(req.employeeId());
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.isPrimary() != null) entity.setIsPrimary(req.isPrimary());
        if (req.effectiveFrom() != null) entity.setEffectiveFrom(req.effectiveFrom());
        if (req.effectiveTo() != null) entity.setEffectiveTo(req.effectiveTo());
        if (req.roleTypeId() != null) entity.setRoleTypeId(req.roleTypeId());
        var saved = repository.save(entity);
        log.info("Updated employee store assignment id={}", id);
        return EmployeeStoreAssignmentResponse.from(saved);
    }
}
