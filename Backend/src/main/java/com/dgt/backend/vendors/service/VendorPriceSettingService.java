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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class VendorPriceSettingService {
    private final VendorPriceSettingRepository repository;
    public VendorPriceSettingService(VendorPriceSettingRepository repository) { this.repository = repository; }

    public PageResponse<VendorPriceSettingResponse> list(int page, int size) {
        log.debug("Listing vendor price setting page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("settingId")));
        log.debug("VendorPriceSetting list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(VendorPriceSettingResponse::from).toList(), page, size, p.getTotalElements());
    }

    public VendorPriceSettingResponse get(Long id) {
        log.debug("Fetching vendor price setting id={}", id);
        return VendorPriceSettingResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("VendorPriceSetting not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public VendorPriceSettingResponse create(CreateVendorPriceSettingRequest req) {
        log.info("Creating vendor price setting");
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
        var saved = repository.save(entity);
        log.info("Created vendor price setting id={}", saved.getVendorPriceSettingId());
        return VendorPriceSettingResponse.from(saved);
    }

    @Transactional
    public VendorPriceSettingResponse update(Long id, UpdateVendorPriceSettingRequest req) {
        log.info("Updating vendor price setting id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("VendorPriceSetting not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.priceChangeAlertEnabled() != null) entity.setPriceChangeAlertEnabled(req.priceChangeAlertEnabled());
        if (req.alertThresholdPercentage() != null) entity.setAlertThresholdPercentage(req.alertThresholdPercentage());
        if (req.approvalRequired() != null) entity.setApprovalRequired(req.approvalRequired());
        if (req.permissionId() != null) entity.setPermissionId(req.permissionId());
        if (req.approvalThresholdPercentage() != null) entity.setApprovalThresholdPercentage(req.approvalThresholdPercentage());
        if (req.autoPickPreferredVendor() != null) entity.setAutoPickPreferredVendor(req.autoPickPreferredVendor());
        if (req.useFallbackVendor() != null) entity.setUseFallbackVendor(req.useFallbackVendor());
        if (req.considerLeadTime() != null) entity.setConsiderLeadTime(req.considerLeadTime());
        var saved = repository.save(entity);
        log.info("Updated vendor price setting id={}", id);
        return VendorPriceSettingResponse.from(saved);
    }
}
