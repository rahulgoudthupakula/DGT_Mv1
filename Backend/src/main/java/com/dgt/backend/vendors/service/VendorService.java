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

@Service
public class VendorService {
    private final VendorRepository repository;
    public VendorService(VendorRepository repository) { this.repository = repository; }

    public PageResponse<VendorResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("vendorId")));
        return new PageResponse<>(p.getContent().stream().map(VendorResponse::from).toList(), page, size, p.getTotalElements());
    }

    public VendorResponse get(Long id) {
        return VendorResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public VendorResponse create(CreateVendorRequest req) {
        var entity = Vendor.builder()
                .vendorName(req.vendorName())
                .email(req.email())
                .phoneNumber(req.phoneNumber())
                .websiteUrl(req.websiteUrl())
                .paymentTerms(req.paymentTerms())
                .leadTimeDays(req.leadTimeDays())
                .isActive(req.isActive())
                .build();
        return VendorResponse.from(repository.save(entity));
    }

    @Transactional
    public VendorResponse update(Long id, UpdateVendorRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.vendorName() != null) entity.setVendorName(req.vendorName());
        if (req.email() != null) entity.setEmail(req.email());
        if (req.phoneNumber() != null) entity.setPhoneNumber(req.phoneNumber());
        if (req.websiteUrl() != null) entity.setWebsiteUrl(req.websiteUrl());
        if (req.paymentTerms() != null) entity.setPaymentTerms(req.paymentTerms());
        if (req.leadTimeDays() != null) entity.setLeadTimeDays(req.leadTimeDays());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        return VendorResponse.from(repository.save(entity));
    }
}
