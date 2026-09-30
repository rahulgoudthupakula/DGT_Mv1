package com.dgt.backend.productstoreprices.service;

import com.dgt.backend.productstoreprices.dto.PriceGroupResponse;
import com.dgt.backend.productstoreprices.dto.CreatePriceGroupRequest;
import com.dgt.backend.productstoreprices.dto.UpdatePriceGroupRequest;
import com.dgt.backend.productstoreprices.entity.PriceGroup;
import com.dgt.backend.productstoreprices.repository.PriceGroupRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PriceGroupService {
    private final PriceGroupRepository repository;
    public PriceGroupService(PriceGroupRepository repository) { this.repository = repository; }

    public PageResponse<PriceGroupResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("priceGroupId")));
        return new PageResponse<>(p.getContent().stream().map(PriceGroupResponse::from).toList(), page, size, p.getTotalElements());
    }

    public PriceGroupResponse get(Long id) {
        return PriceGroupResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public PriceGroupResponse create(CreatePriceGroupRequest req) {
        var entity = PriceGroup.builder()
                .priceGroupName(req.priceGroupName())
                .description(req.description())
                .isActive(req.isActive())
                .groupPrice(req.groupPrice())
                .dgtId(req.dgtId())
                .build();
        return PriceGroupResponse.from(repository.save(entity));
    }

    @Transactional
    public PriceGroupResponse update(Long id, UpdatePriceGroupRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.priceGroupName() != null) entity.setPriceGroupName(req.priceGroupName());
        if (req.description() != null) entity.setDescription(req.description());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        if (req.groupPrice() != null) entity.setGroupPrice(req.groupPrice());
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        return PriceGroupResponse.from(repository.save(entity));
    }
}
