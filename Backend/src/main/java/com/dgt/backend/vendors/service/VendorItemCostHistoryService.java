package com.dgt.backend.vendors.service;

import com.dgt.backend.vendors.dto.VendorItemCostHistoryResponse;
import com.dgt.backend.vendors.dto.CreateVendorItemCostHistoryRequest;
import com.dgt.backend.vendors.dto.UpdateVendorItemCostHistoryRequest;
import com.dgt.backend.vendors.entity.VendorItemCostHistory;
import com.dgt.backend.vendors.repository.VendorItemCostHistoryRepository;
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
public class VendorItemCostHistoryService {
    private final VendorItemCostHistoryRepository repository;
    public VendorItemCostHistoryService(VendorItemCostHistoryRepository repository) { this.repository = repository; }

    public PageResponse<VendorItemCostHistoryResponse> list(int page, int size) {
        log.debug("Listing vendor item cost history page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("costHistoryId")));
        log.debug("VendorItemCostHistory list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(VendorItemCostHistoryResponse::from).toList(), page, size, p.getTotalElements());
    }

    public VendorItemCostHistoryResponse get(Long id) {
        log.debug("Fetching vendor item cost history id={}", id);
        return VendorItemCostHistoryResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("VendorItemCostHistory not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public VendorItemCostHistoryResponse create(CreateVendorItemCostHistoryRequest req) {
        log.info("Creating vendor item cost history");
        var entity = VendorItemCostHistory.builder()
                .productId(req.productId())
                .vendorId(req.vendorId())
                .oldCost(req.oldCost())
                .newCost(req.newCost())
                .changePercentage(req.changePercentage())
                .effectiveDate(req.effectiveDate())
                .changeSource(req.changeSource())
                .changedBy(req.changedBy())
                .build();
        var saved = repository.save(entity);
        log.info("Created vendor item cost history id={}", saved.getVendorItemCostHistoryId());
        return VendorItemCostHistoryResponse.from(saved);
    }

    @Transactional
    public VendorItemCostHistoryResponse update(Long id, UpdateVendorItemCostHistoryRequest req) {
        log.info("Updating vendor item cost history id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("VendorItemCostHistory not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.vendorId() != null) entity.setVendorId(req.vendorId());
        if (req.oldCost() != null) entity.setOldCost(req.oldCost());
        if (req.newCost() != null) entity.setNewCost(req.newCost());
        if (req.changePercentage() != null) entity.setChangePercentage(req.changePercentage());
        if (req.effectiveDate() != null) entity.setEffectiveDate(req.effectiveDate());
        if (req.changeSource() != null) entity.setChangeSource(req.changeSource());
        if (req.changedBy() != null) entity.setChangedBy(req.changedBy());
        var saved = repository.save(entity);
        log.info("Updated vendor item cost history id={}", id);
        return VendorItemCostHistoryResponse.from(saved);
    }
}
