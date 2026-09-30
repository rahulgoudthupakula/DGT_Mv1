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

@Service
public class EmployeeService {
    private final EmployeeRepository repository;
    public EmployeeService(EmployeeRepository repository) { this.repository = repository; }

    public PageResponse<EmployeeResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("employeeId")));
        return new PageResponse<>(p.getContent().stream().map(EmployeeResponse::from).toList(), page, size, p.getTotalElements());
    }

    public EmployeeResponse get(Long id) {
        return EmployeeResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public EmployeeResponse create(CreateEmployeeRequest req) {
        var entity = Employee.builder()
                .hireDate(req.hireDate())
                .terminationDate(req.terminationDate())
                .employeeType(req.employeeType())
                .userId(req.userId())
                .build();
        return EmployeeResponse.from(repository.save(entity));
    }

    @Transactional
    public EmployeeResponse update(Long id, UpdateEmployeeRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.hireDate() != null) entity.setHireDate(req.hireDate());
        if (req.terminationDate() != null) entity.setTerminationDate(req.terminationDate());
        if (req.employeeType() != null) entity.setEmployeeType(req.employeeType());
        if (req.userId() != null) entity.setUserId(req.userId());
        return EmployeeResponse.from(repository.save(entity));
    }
}
