package com.dgt.backend.employees.service;

import com.dgt.backend.employees.dto.EmployeeScheduleResponse;
import com.dgt.backend.employees.dto.CreateEmployeeScheduleRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeScheduleRequest;
import com.dgt.backend.employees.entity.EmployeeSchedule;
import com.dgt.backend.employees.repository.EmployeeScheduleRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmployeeScheduleService {
    private final EmployeeScheduleRepository repository;
    public EmployeeScheduleService(EmployeeScheduleRepository repository) { this.repository = repository; }

    public PageResponse<EmployeeScheduleResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("scheduleId")));
        return new PageResponse<>(p.getContent().stream().map(EmployeeScheduleResponse::from).toList(), page, size, p.getTotalElements());
    }

    public EmployeeScheduleResponse get(Long id) {
        return EmployeeScheduleResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public EmployeeScheduleResponse create(CreateEmployeeScheduleRequest req) {
        var entity = EmployeeSchedule.builder()
                .employeeId(req.employeeId())
                .dgtId(req.dgtId())
                .workDate(req.workDate())
                .scheduleStart(req.scheduleStart())
                .scheduleEnd(req.scheduleEnd())
                .status(req.status())
                .notes(req.notes())
                .createdBy(req.createdBy())
                .build();
        return EmployeeScheduleResponse.from(repository.save(entity));
    }

    @Transactional
    public EmployeeScheduleResponse update(Long id, UpdateEmployeeScheduleRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.employeeId() != null) entity.setEmployeeId(req.employeeId());
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.workDate() != null) entity.setWorkDate(req.workDate());
        if (req.scheduleStart() != null) entity.setScheduleStart(req.scheduleStart());
        if (req.scheduleEnd() != null) entity.setScheduleEnd(req.scheduleEnd());
        if (req.status() != null) entity.setStatus(req.status());
        if (req.notes() != null) entity.setNotes(req.notes());
        if (req.createdBy() != null) entity.setCreatedBy(req.createdBy());
        return EmployeeScheduleResponse.from(repository.save(entity));
    }
}
