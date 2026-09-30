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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class EmployeeTimeOffRequestService {
    private final EmployeeTimeOffRequestRepository repository;
    public EmployeeTimeOffRequestService(EmployeeTimeOffRequestRepository repository) { this.repository = repository; }

    public PageResponse<EmployeeTimeOffRequestResponse> list(int page, int size) {
        log.debug("Listing employee time off request page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("timeOffRequestId")));
        log.debug("EmployeeTimeOffRequest list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(EmployeeTimeOffRequestResponse::from).toList(), page, size, p.getTotalElements());
    }

    public EmployeeTimeOffRequestResponse get(Long id) {
        log.debug("Fetching employee time off request id={}", id);
        return EmployeeTimeOffRequestResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("EmployeeTimeOffRequest not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public EmployeeTimeOffRequestResponse create(CreateEmployeeTimeOffRequestRequest req) {
        log.info("Creating employee time off request");
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
        var saved = repository.save(entity);
        log.info("Created employee time off request id={}", saved.getEmployeeTimeOffRequestId());
        return EmployeeTimeOffRequestResponse.from(saved);
    }

    @Transactional
    public EmployeeTimeOffRequestResponse update(Long id, UpdateEmployeeTimeOffRequestRequest req) {
        log.info("Updating employee time off request id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("EmployeeTimeOffRequest not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
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
        var saved = repository.save(entity);
        log.info("Updated employee time off request id={}", id);
        return EmployeeTimeOffRequestResponse.from(saved);
    }
}
