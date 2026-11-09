package com.dgt.backend.sales.service;

import com.dgt.backend.sales.dto.TenderTypeResponse;
import com.dgt.backend.sales.dto.CreateTenderTypeRequest;
import com.dgt.backend.sales.dto.UpdateTenderTypeRequest;
import com.dgt.backend.sales.entity.TenderType;
import com.dgt.backend.sales.repository.TenderTypeRepository;
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
// Coordinate tender type persistence and response mapping; caller authorization is handled at the controller.
public class TenderTypeService {
    private final TenderTypeRepository repository;
    public TenderTypeService(TenderTypeRepository repository) { this.repository = repository; }

    // Read a page sorted by primary key and include the total record count.
    public PageResponse<TenderTypeResponse> list(int page, int size) {
        log.debug("Listing tender type page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("tenderTypeId")));
        log.debug("TenderType list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(TenderTypeResponse::from).toList(), page, size, p.getTotalElements());
    }

    // Map the stored record to the API response, or return HTTP 404 when absent.
    public TenderTypeResponse get(Long id) {
        log.debug("Fetching tender type id={}", id);
        return TenderTypeResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("TenderType not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    // Build and save a record from the submitted create fields inside the transaction.
    public TenderTypeResponse create(CreateTenderTypeRequest req) {
        log.info("Creating tender type");
        var entity = TenderType.builder()
                .tenderCode(req.tenderCode())
                .tenderName(req.tenderName())
                .isActive(req.isActive())
                .build();
        var saved = repository.save(entity);
        log.info("Created tender type id={}", saved.getTenderTypeId());
        return TenderTypeResponse.from(saved);
    }

    @Transactional
    // Load the existing record and apply only non-null fields; null does not clear a stored value.
    public TenderTypeResponse update(Long id, UpdateTenderTypeRequest req) {
        log.info("Updating tender type id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("TenderType not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.tenderCode() != null) entity.setTenderCode(req.tenderCode());
        if (req.tenderName() != null) entity.setTenderName(req.tenderName());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        var saved = repository.save(entity);
        log.info("Updated tender type id={}", id);
        return TenderTypeResponse.from(saved);
    }
}
