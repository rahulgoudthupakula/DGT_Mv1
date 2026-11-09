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
import lombok.extern.slf4j.Slf4j;

/**
 * JPA CRUD operations for EmployeeSchedule.
 * The caller is responsible for authorization and workflow validation; these queries add no store predicate.
 */

@Slf4j
@Service
public class EmployeeScheduleService {
    private final EmployeeScheduleRepository repository;
    public EmployeeScheduleService(EmployeeScheduleRepository repository) { this.repository = repository; }

    /** Load a page sorted by primary key and map its records to response DTOs. */
    public PageResponse<EmployeeScheduleResponse> list(int page, int size) {
        log.debug("Listing employee schedule page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("scheduleId")));
        log.debug("EmployeeSchedule list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(EmployeeScheduleResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load a record by ID or return HTTP 404. */
    public EmployeeScheduleResponse get(Long id) {
        log.debug("Fetching employee schedule id={}", id);
        return EmployeeScheduleResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("EmployeeSchedule not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
    @Transactional
    public EmployeeScheduleResponse create(CreateEmployeeScheduleRequest req) {
        log.info("Creating employee schedule");
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
        var saved = repository.save(entity);
        log.info("Created employee schedule id={}", saved.getScheduleId());
        return EmployeeScheduleResponse.from(saved);
    }

    /** Apply only non-null fields in one transaction, leaving omitted fields unchanged. */
    @Transactional
    public EmployeeScheduleResponse update(Long id, UpdateEmployeeScheduleRequest req) {
        log.info("Updating employee schedule id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("EmployeeSchedule not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.employeeId() != null) entity.setEmployeeId(req.employeeId());
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.workDate() != null) entity.setWorkDate(req.workDate());
        if (req.scheduleStart() != null) entity.setScheduleStart(req.scheduleStart());
        if (req.scheduleEnd() != null) entity.setScheduleEnd(req.scheduleEnd());
        if (req.status() != null) entity.setStatus(req.status());
        if (req.notes() != null) entity.setNotes(req.notes());
        if (req.createdBy() != null) entity.setCreatedBy(req.createdBy());
        var saved = repository.save(entity);
        log.info("Updated employee schedule id={}", id);
        return EmployeeScheduleResponse.from(saved);
    }
}
