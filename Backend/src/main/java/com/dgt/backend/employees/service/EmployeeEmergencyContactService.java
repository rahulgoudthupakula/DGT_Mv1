package com.dgt.backend.employees.service;

import com.dgt.backend.employees.dto.EmployeeEmergencyContactResponse;
import com.dgt.backend.employees.dto.CreateEmployeeEmergencyContactRequest;
import com.dgt.backend.employees.dto.UpdateEmployeeEmergencyContactRequest;
import com.dgt.backend.employees.entity.EmployeeEmergencyContact;
import com.dgt.backend.employees.repository.EmployeeEmergencyContactRepository;
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
public class EmployeeEmergencyContactService {
    private final EmployeeEmergencyContactRepository repository;
    public EmployeeEmergencyContactService(EmployeeEmergencyContactRepository repository) { this.repository = repository; }

    public PageResponse<EmployeeEmergencyContactResponse> list(int page, int size) {
        log.debug("Listing employee emergency contact page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("emergencyContactId")));
        log.debug("EmployeeEmergencyContact list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(EmployeeEmergencyContactResponse::from).toList(), page, size, p.getTotalElements());
    }

    public EmployeeEmergencyContactResponse get(Long id) {
        log.debug("Fetching employee emergency contact id={}", id);
        return EmployeeEmergencyContactResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("EmployeeEmergencyContact not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public EmployeeEmergencyContactResponse create(CreateEmployeeEmergencyContactRequest req) {
        log.info("Creating employee emergency contact");
        var entity = EmployeeEmergencyContact.builder()
                .employeeId(req.employeeId())
                .contactName(req.contactName())
                .relationship(req.relationship())
                .phone(req.phone())
                .build();
        var saved = repository.save(entity);
        log.info("Created employee emergency contact id={}", saved.getEmployeeEmergencyContactId());
        return EmployeeEmergencyContactResponse.from(saved);
    }

    @Transactional
    public EmployeeEmergencyContactResponse update(Long id, UpdateEmployeeEmergencyContactRequest req) {
        log.info("Updating employee emergency contact id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("EmployeeEmergencyContact not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.employeeId() != null) entity.setEmployeeId(req.employeeId());
        if (req.contactName() != null) entity.setContactName(req.contactName());
        if (req.relationship() != null) entity.setRelationship(req.relationship());
        if (req.phone() != null) entity.setPhone(req.phone());
        var saved = repository.save(entity);
        log.info("Updated employee emergency contact id={}", id);
        return EmployeeEmergencyContactResponse.from(saved);
    }
}
