package com.dgt.backend.vendors.service;

import com.dgt.backend.vendors.dto.VendorPriceSettingResponse;
import com.dgt.backend.vendors.dto.CreateVendorPriceSettingRequest;
import com.dgt.backend.vendors.dto.UpdateVendorPriceSettingRequest;
import com.dgt.backend.vendors.entity.VendorPriceSetting;
import com.dgt.backend.vendors.repository.VendorPriceSettingRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class VendorPriceSettingService {
    private final VendorPriceSettingRepository repository;
    public VendorPriceSettingService(VendorPriceSettingRepository repository) { this.repository = repository; }

    public PageResponse<VendorPriceSettingResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("settingId")));
        return new PageResponse<>(p.getContent().stream().map(VendorPriceSettingResponse::from).toList(), page, size, p.getTotalElements());
    }

    public VendorPriceSettingResponse get(Long id) {
        return VendorPriceSettingResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public VendorPriceSettingResponse create(CreateVendorPriceSettingRequest req) {
        var entity = VendorPriceSetting.builder()
                .dgtId(req.dgtId())
                .priceChangeAlertEnabled(req.priceChangeAlertEnabled())
                .alertThresholdPercentage(req.alertThresholdPercentage())
                .approvalRequired(req.approvalRequired())
                .permissionId(req.permissionId())
                .approvalThresholdPercentage(req.approvalThresholdPercentage())
                .autoPickPreferredVendor(req.autoPickPreferredVendor())
                .useFallbackVendor(req.useFallbackVendor())
                .considerLeadTime(req.considerLeadTime())
                .build();
        return VendorPriceSettingResponse.from(repository.save(entity));
    }

    @Transactional
    public VendorPriceSettingResponse update(Long id, UpdateVendorPriceSettingRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.priceChangeAlertEnabled() != null) entity.setPriceChangeAlertEnabled(req.priceChangeAlertEnabled());
        if (req.alertThresholdPercentage() != null) entity.setAlertThresholdPercentage(req.alertThresholdPercentage());
        if (req.approvalRequired() != null) entity.setApprovalRequired(req.approvalRequired());
        if (req.permissionId() != null) entity.setPermissionId(req.permissionId());
        if (req.approvalThresholdPercentage() != null) entity.setApprovalThresholdPercentage(req.approvalThresholdPercentage());
        if (req.autoPickPreferredVendor() != null) entity.setAutoPickPreferredVendor(req.autoPickPreferredVendor());
        if (req.useFallbackVendor() != null) entity.setUseFallbackVendor(req.useFallbackVendor());
        if (req.considerLeadTime() != null) entity.setConsiderLeadTime(req.considerLeadTime());
        return VendorPriceSettingResponse.from(repository.save(entity));
    }
}
