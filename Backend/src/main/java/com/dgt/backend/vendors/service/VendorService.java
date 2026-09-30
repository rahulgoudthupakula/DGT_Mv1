package com.dgt.backend.vendors.service;

import com.dgt.backend.vendors.dto.VendorResponse;
import com.dgt.backend.vendors.dto.CreateVendorRequest;
import com.dgt.backend.vendors.dto.UpdateVendorRequest;
import com.dgt.backend.vendors.entity.Vendor;
import com.dgt.backend.vendors.repository.VendorRepository;
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
public class VendorService {
    private final VendorRepository repository;
    public VendorService(VendorRepository repository) { this.repository = repository; }

    public PageResponse<VendorResponse> list(int page, int size) {
        log.debug("Listing vendor page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("vendorId")));
        log.debug("Vendor list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(VendorResponse::from).toList(), page, size, p.getTotalElements());
    }

    public VendorResponse get(Long id) {
        log.debug("Fetching vendor id={}", id);
        return VendorResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Vendor not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public VendorResponse create(CreateVendorRequest req) {
        log.info("Creating vendor");
        var entity = Vendor.builder()
                .vendorName(req.vendorName())
                .email(req.email())
                .phoneNumber(req.phoneNumber())
                .websiteUrl(req.websiteUrl())
                .paymentTerms(req.paymentTerms())
                .leadTimeDays(req.leadTimeDays())
                .isActive(req.isActive())
                .build();
        var saved = repository.save(entity);
        log.info("Created vendor id={}", saved.getVendorId());
        return VendorResponse.from(saved);
    }

    @Transactional
    public VendorResponse update(Long id, UpdateVendorRequest req) {
        log.info("Updating vendor id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Vendor not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.vendorName() != null) entity.setVendorName(req.vendorName());
        if (req.email() != null) entity.setEmail(req.email());
        if (req.phoneNumber() != null) entity.setPhoneNumber(req.phoneNumber());
        if (req.websiteUrl() != null) entity.setWebsiteUrl(req.websiteUrl());
        if (req.paymentTerms() != null) entity.setPaymentTerms(req.paymentTerms());
        if (req.leadTimeDays() != null) entity.setLeadTimeDays(req.leadTimeDays());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        var saved = repository.save(entity);
        log.info("Updated vendor id={}", id);
        return VendorResponse.from(saved);
    }
}
