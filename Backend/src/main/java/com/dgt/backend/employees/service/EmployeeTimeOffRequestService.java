package com.dgt.backend.employees.service;

import com.dgt.backend.employees.dto.EmployeeTimeOffRequestResponse;
import com.dgt.backend.employees.dto.CreateEmployeeTimeOffRequestRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeTimeOffRequestRequest;
import com.dgt.backend.employees.entity.EmployeeTimeOffRequest;
import com.dgt.backend.employees.repository.EmployeeTimeOffRequestRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmployeeTimeOffRequestService {
    private final EmployeeTimeOffRequestRepository repository;
    public EmployeeTimeOffRequestService(EmployeeTimeOffRequestRepository repository) { this.repository = repository; }

    public PageResponse<EmployeeTimeOffRequestResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("timeOffRequestId")));
        return new PageResponse<>(p.getContent().stream().map(EmployeeTimeOffRequestResponse::from).toList(), page, size, p.getTotalElements());
    }

    public EmployeeTimeOffRequestResponse get(Long id) {
        return EmployeeTimeOffRequestResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public EmployeeTimeOffRequestResponse create(CreateEmployeeTimeOffRequestRequest req) {
        var entity = EmployeeTimeOffRequest.builder()
                .employeeId(req.employeeId())
                .requestType(req.requestType())
                .startDate(req.startDate())
                .endDate(req.endDate())
                .hoursRequested(req.hoursRequested())
                .reason(req.reason())
                .statusTypeId(req.statusTypeId())
                .requestedAt(req.requestedAt())
                .reviewedBy(req.reviewedBy())
                .reviewedAt(req.reviewedAt())
                .rejectedReason(req.rejectedReason())
                .build();
        return EmployeeTimeOffRequestResponse.from(repository.save(entity));
    }

    @Transactional
    public EmployeeTimeOffRequestResponse update(Long id, UpdateEmployeeTimeOffRequestRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.employeeId() != null) entity.setEmployeeId(req.employeeId());
        if (req.requestType() != null) entity.setRequestType(req.requestType());
        if (req.startDate() != null) entity.setStartDate(req.startDate());
        if (req.endDate() != null) entity.setEndDate(req.endDate());
        if (req.hoursRequested() != null) entity.setHoursRequested(req.hoursRequested());
        if (req.reason() != null) entity.setReason(req.reason());
        if (req.statusTypeId() != null) entity.setStatusTypeId(req.statusTypeId());
        if (req.requestedAt() != null) entity.setRequestedAt(req.requestedAt());
        if (req.reviewedBy() != null) entity.setReviewedBy(req.reviewedBy());
        if (req.reviewedAt() != null) entity.setReviewedAt(req.reviewedAt());
        if (req.rejectedReason() != null) entity.setRejectedReason(req.rejectedReason());
        return EmployeeTimeOffRequestResponse.from(repository.save(entity));
    }
}
