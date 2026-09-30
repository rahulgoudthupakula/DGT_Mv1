package com.dgt.backend.employees.service;

import com.dgt.backend.employees.dto.EmployeeTimeEntryResponse;
import com.dgt.backend.employees.dto.CreateEmployeeTimeEntryRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeTimeEntryRequest;
import com.dgt.backend.employees.entity.EmployeeTimeEntry;
import com.dgt.backend.employees.repository.EmployeeTimeEntryRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmployeeTimeEntrieService {
    private final EmployeeTimeEntryRepository repository;
    public EmployeeTimeEntrieService(EmployeeTimeEntryRepository repository) { this.repository = repository; }

    public PageResponse<EmployeeTimeEntryResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("timeEntryId")));
        return new PageResponse<>(p.getContent().stream().map(EmployeeTimeEntryResponse::from).toList(), page, size, p.getTotalElements());
    }

    public EmployeeTimeEntryResponse get(Long id) {
        return EmployeeTimeEntryResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public EmployeeTimeEntryResponse create(CreateEmployeeTimeEntryRequest req) {
        var entity = EmployeeTimeEntry.builder()
                .employeeId(req.employeeId())
                .dgtId(req.dgtId())
                .clockIn(req.clockIn())
                .clockOut(req.clockOut())
                .regularHours(req.regularHours())
                .overtimeHours(req.overtimeHours())
                .eventType(req.eventType())
                .build();
        return EmployeeTimeEntryResponse.from(repository.save(entity));
    }

    @Transactional
    public EmployeeTimeEntryResponse update(Long id, UpdateEmployeeTimeEntryRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.employeeId() != null) entity.setEmployeeId(req.employeeId());
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.clockIn() != null) entity.setClockIn(req.clockIn());
        if (req.clockOut() != null) entity.setClockOut(req.clockOut());
        if (req.regularHours() != null) entity.setRegularHours(req.regularHours());
        if (req.overtimeHours() != null) entity.setOvertimeHours(req.overtimeHours());
        if (req.eventType() != null) entity.setEventType(req.eventType());
        return EmployeeTimeEntryResponse.from(repository.save(entity));
    }
}
