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

@Service
public class EmployeeStatusHistoryService {
    private final EmployeeStatusHistoryRepository repository;
    public EmployeeStatusHistoryService(EmployeeStatusHistoryRepository repository) { this.repository = repository; }

    public PageResponse<EmployeeStatusHistoryResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("statusHistoryId")));
        return new PageResponse<>(p.getContent().stream().map(EmployeeStatusHistoryResponse::from).toList(), page, size, p.getTotalElements());
    }

    public EmployeeStatusHistoryResponse get(Long id) {
        return EmployeeStatusHistoryResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public EmployeeStatusHistoryResponse create(CreateEmployeeStatusHistoryRequest req) {
        var entity = EmployeeStatusHistory.builder()
                .employeeId(req.employeeId())
                .status(req.status())
                .statusTypeId(req.statusTypeId())
                .build();
        return EmployeeStatusHistoryResponse.from(repository.save(entity));
    }

    @Transactional
    public EmployeeStatusHistoryResponse update(Long id, UpdateEmployeeStatusHistoryRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.employeeId() != null) entity.setEmployeeId(req.employeeId());
        if (req.status() != null) entity.setStatus(req.status());
        if (req.statusTypeId() != null) entity.setStatusTypeId(req.statusTypeId());
        return EmployeeStatusHistoryResponse.from(repository.save(entity));
    }
}
