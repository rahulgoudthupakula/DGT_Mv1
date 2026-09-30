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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class PriceGroupService {
    private final PriceGroupRepository repository;
    public PriceGroupService(PriceGroupRepository repository) { this.repository = repository; }

    public PageResponse<PriceGroupResponse> list(int page, int size) {
        log.debug("Listing price group page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("priceGroupId")));
        log.debug("PriceGroup list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(PriceGroupResponse::from).toList(), page, size, p.getTotalElements());
    }

    public PriceGroupResponse get(Long id) {
        log.debug("Fetching price group id={}", id);
        return PriceGroupResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("PriceGroup not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public PriceGroupResponse create(CreatePriceGroupRequest req) {
        log.info("Creating price group");
        var entity = PriceGroup.builder()
                .priceGroupName(req.priceGroupName())
                .description(req.description())
                .isActive(req.isActive())
                .groupPrice(req.groupPrice())
                .dgtId(req.dgtId())
                .build();
        var saved = repository.save(entity);
        log.info("Created price group id={}", saved.getPriceGroupId());
        return PriceGroupResponse.from(saved);
    }

    @Transactional
    public PriceGroupResponse update(Long id, UpdatePriceGroupRequest req) {
        log.info("Updating price group id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("PriceGroup not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.priceGroupName() != null) entity.setPriceGroupName(req.priceGroupName());
        if (req.description() != null) entity.setDescription(req.description());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        if (req.groupPrice() != null) entity.setGroupPrice(req.groupPrice());
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        var saved = repository.save(entity);
        log.info("Updated price group id={}", id);
        return PriceGroupResponse.from(saved);
    }
}
