package com.dgt.backend.identity.service;

import com.dgt.backend.identity.dto.StatusTypeResponse;
import com.dgt.backend.identity.dto.CreateStatusTypeRequest;
import com.dgt.backend.identity.dto.UpdateStatusTypeRequest;
import com.dgt.backend.identity.entity.StatusType;
import com.dgt.backend.identity.repository.StatusTypeRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StatusTypeService {
    private final StatusTypeRepository repository;
    public StatusTypeService(StatusTypeRepository repository) { this.repository = repository; }

    public PageResponse<StatusTypeResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("statusTypeId")));
        return new PageResponse<>(p.getContent().stream().map(StatusTypeResponse::from).toList(), page, size, p.getTotalElements());
    }

    public StatusTypeResponse get(Long id) {
        return StatusTypeResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public StatusTypeResponse create(CreateStatusTypeRequest req) {
        var entity = StatusType.builder()
                .statusName(req.statusName())
                .build();
        return StatusTypeResponse.from(repository.save(entity));
    }

    @Transactional
    public StatusTypeResponse update(Long id, UpdateStatusTypeRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.statusName() != null) entity.setStatusName(req.statusName());
        return StatusTypeResponse.from(repository.save(entity));
    }
}
