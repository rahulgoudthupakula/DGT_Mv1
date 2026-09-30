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

@Service
public class VendorItemCostHistoryService {
    private final VendorItemCostHistoryRepository repository;
    public VendorItemCostHistoryService(VendorItemCostHistoryRepository repository) { this.repository = repository; }

    public PageResponse<VendorItemCostHistoryResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("costHistoryId")));
        return new PageResponse<>(p.getContent().stream().map(VendorItemCostHistoryResponse::from).toList(), page, size, p.getTotalElements());
    }

    public VendorItemCostHistoryResponse get(Long id) {
        return VendorItemCostHistoryResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public VendorItemCostHistoryResponse create(CreateVendorItemCostHistoryRequest req) {
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
        return VendorItemCostHistoryResponse.from(repository.save(entity));
    }

    @Transactional
    public VendorItemCostHistoryResponse update(Long id, UpdateVendorItemCostHistoryRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.productId() != null) entity.setProductId(req.productId());
        if (req.vendorId() != null) entity.setVendorId(req.vendorId());
        if (req.oldCost() != null) entity.setOldCost(req.oldCost());
        if (req.newCost() != null) entity.setNewCost(req.newCost());
        if (req.changePercentage() != null) entity.setChangePercentage(req.changePercentage());
        if (req.effectiveDate() != null) entity.setEffectiveDate(req.effectiveDate());
        if (req.changeSource() != null) entity.setChangeSource(req.changeSource());
        if (req.changedBy() != null) entity.setChangedBy(req.changedBy());
        return VendorItemCostHistoryResponse.from(repository.save(entity));
    }
}
