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

@Service
public class EmployeeEmergencyContactService {
    private final EmployeeEmergencyContactRepository repository;
    public EmployeeEmergencyContactService(EmployeeEmergencyContactRepository repository) { this.repository = repository; }

    public PageResponse<EmployeeEmergencyContactResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("emergencyContactId")));
        return new PageResponse<>(p.getContent().stream().map(EmployeeEmergencyContactResponse::from).toList(), page, size, p.getTotalElements());
    }

    public EmployeeEmergencyContactResponse get(Long id) {
        return EmployeeEmergencyContactResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public EmployeeEmergencyContactResponse create(CreateEmployeeEmergencyContactRequest req) {
        var entity = EmployeeEmergencyContact.builder()
                .employeeId(req.employeeId())
                .contactName(req.contactName())
                .relationship(req.relationship())
                .phone(req.phone())
                .build();
        return EmployeeEmergencyContactResponse.from(repository.save(entity));
    }

    @Transactional
    public EmployeeEmergencyContactResponse update(Long id, UpdateEmployeeEmergencyContactRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.employeeId() != null) entity.setEmployeeId(req.employeeId());
        if (req.contactName() != null) entity.setContactName(req.contactName());
        if (req.relationship() != null) entity.setRelationship(req.relationship());
        if (req.phone() != null) entity.setPhone(req.phone());
        return EmployeeEmergencyContactResponse.from(repository.save(entity));
    }
}
