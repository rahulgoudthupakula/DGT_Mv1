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

@Service
public class DepartmentService {
    private final DepartmentRepository repository;
    public DepartmentService(DepartmentRepository repository) { this.repository = repository; }

    public PageResponse<DepartmentResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("departmentId")));
        return new PageResponse<>(p.getContent().stream().map(DepartmentResponse::from).toList(), page, size, p.getTotalElements());
    }

    public DepartmentResponse get(Long id) {
        return DepartmentResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public DepartmentResponse create(CreateDepartmentRequest req) {
        var entity = Department.builder()
                .departmentName(req.departmentName())
                .isDefault(req.isDefault())
                .build();
        return DepartmentResponse.from(repository.save(entity));
    }

    @Transactional
    public DepartmentResponse update(Long id, UpdateDepartmentRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.departmentName() != null) entity.setDepartmentName(req.departmentName());
        if (req.isDefault() != null) entity.setIsDefault(req.isDefault());
        return DepartmentResponse.from(repository.save(entity));
    }
}
