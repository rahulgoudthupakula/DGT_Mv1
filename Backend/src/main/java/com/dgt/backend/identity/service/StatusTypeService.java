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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class StatusTypeService {
    private final StatusTypeRepository repository;
    public StatusTypeService(StatusTypeRepository repository) { this.repository = repository; }

    public PageResponse<StatusTypeResponse> list(int page, int size) {
        log.debug("Listing status type page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("statusTypeId")));
        log.debug("StatusType list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(StatusTypeResponse::from).toList(), page, size, p.getTotalElements());
    }

    public StatusTypeResponse get(Long id) {
        log.debug("Fetching status type id={}", id);
        return StatusTypeResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("StatusType not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public StatusTypeResponse create(CreateStatusTypeRequest req) {
        log.info("Creating status type");
        var entity = StatusType.builder()
                .statusName(req.statusName())
                .build();
        var saved = repository.save(entity);
        log.info("Created status type id={}", saved.getStatusTypeId());
        return StatusTypeResponse.from(saved);
    }

    @Transactional
    public StatusTypeResponse update(Long id, UpdateStatusTypeRequest req) {
        log.info("Updating status type id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("StatusType not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.statusName() != null) entity.setStatusName(req.statusName());
        var saved = repository.save(entity);
        log.info("Updated status type id={}", id);
        return StatusTypeResponse.from(saved);
    }
}
