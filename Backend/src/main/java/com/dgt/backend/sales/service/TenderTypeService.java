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

@Service
public class TenderTypeService {
    private final TenderTypeRepository repository;
    public TenderTypeService(TenderTypeRepository repository) { this.repository = repository; }

    public PageResponse<TenderTypeResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("tenderTypeId")));
        return new PageResponse<>(p.getContent().stream().map(TenderTypeResponse::from).toList(), page, size, p.getTotalElements());
    }

    public TenderTypeResponse get(Long id) {
        return TenderTypeResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public TenderTypeResponse create(CreateTenderTypeRequest req) {
        var entity = TenderType.builder()
                .tenderCode(req.tenderCode())
                .tenderName(req.tenderName())
                .isActive(req.isActive())
                .build();
        return TenderTypeResponse.from(repository.save(entity));
    }

    @Transactional
    public TenderTypeResponse update(Long id, UpdateTenderTypeRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.tenderCode() != null) entity.setTenderCode(req.tenderCode());
        if (req.tenderName() != null) entity.setTenderName(req.tenderName());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        return TenderTypeResponse.from(repository.save(entity));
    }
}
