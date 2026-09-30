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

@Service
public class EmployeeStoreAssignmentService {
    private final EmployeeStoreAssignmentRepository repository;
    public EmployeeStoreAssignmentService(EmployeeStoreAssignmentRepository repository) { this.repository = repository; }

    public PageResponse<EmployeeStoreAssignmentResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("employeeStoreAssignmentId")));
        return new PageResponse<>(p.getContent().stream().map(EmployeeStoreAssignmentResponse::from).toList(), page, size, p.getTotalElements());
    }

    public EmployeeStoreAssignmentResponse get(Long id) {
        return EmployeeStoreAssignmentResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public EmployeeStoreAssignmentResponse create(CreateEmployeeStoreAssignmentRequest req) {
        var entity = EmployeeStoreAssignment.builder()
                .employeeId(req.employeeId())
                .dgtId(req.dgtId())
                .isPrimary(req.isPrimary())
                .effectiveFrom(req.effectiveFrom())
                .effectiveTo(req.effectiveTo())
                .roleTypeId(req.roleTypeId())
                .build();
        return EmployeeStoreAssignmentResponse.from(repository.save(entity));
    }

    @Transactional
    public EmployeeStoreAssignmentResponse update(Long id, UpdateEmployeeStoreAssignmentRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.employeeId() != null) entity.setEmployeeId(req.employeeId());
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.isPrimary() != null) entity.setIsPrimary(req.isPrimary());
        if (req.effectiveFrom() != null) entity.setEffectiveFrom(req.effectiveFrom());
        if (req.effectiveTo() != null) entity.setEffectiveTo(req.effectiveTo());
        if (req.roleTypeId() != null) entity.setRoleTypeId(req.roleTypeId());
        return EmployeeStoreAssignmentResponse.from(repository.save(entity));
    }
}
