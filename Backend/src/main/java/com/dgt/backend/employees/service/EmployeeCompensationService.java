package com.dgt.backend.employees.service;

import com.dgt.backend.employees.dto.EmployeeCompensationResponse;
import com.dgt.backend.employees.dto.CreateEmployeeCompensationRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeCompensationRequest;
import com.dgt.backend.employees.entity.EmployeeCompensation;
import com.dgt.backend.employees.repository.EmployeeCompensationRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmployeeCompensationService {
    private final EmployeeCompensationRepository repository;
    public EmployeeCompensationService(EmployeeCompensationRepository repository) { this.repository = repository; }

    public PageResponse<EmployeeCompensationResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("compensationId")));
        return new PageResponse<>(p.getContent().stream().map(EmployeeCompensationResponse::from).toList(), page, size, p.getTotalElements());
    }

    public EmployeeCompensationResponse get(Long id) {
        return EmployeeCompensationResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public EmployeeCompensationResponse create(CreateEmployeeCompensationRequest req) {
        var entity = EmployeeCompensation.builder()
                .employeeId(req.employeeId())
                .payType(req.payType())
                .hourlyRate(req.hourlyRate())
                .annualSalary(req.annualSalary())
                .effectiveFrom(req.effectiveFrom())
                .effectiveTo(req.effectiveTo())
                .build();
        return EmployeeCompensationResponse.from(repository.save(entity));
    }

    @Transactional
    public EmployeeCompensationResponse update(Long id, UpdateEmployeeCompensationRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.employeeId() != null) entity.setEmployeeId(req.employeeId());
        if (req.payType() != null) entity.setPayType(req.payType());
        if (req.hourlyRate() != null) entity.setHourlyRate(req.hourlyRate());
        if (req.annualSalary() != null) entity.setAnnualSalary(req.annualSalary());
        if (req.effectiveFrom() != null) entity.setEffectiveFrom(req.effectiveFrom());
        if (req.effectiveTo() != null) entity.setEffectiveTo(req.effectiveTo());
        return EmployeeCompensationResponse.from(repository.save(entity));
    }
}
