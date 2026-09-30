package com.dgt.backend.vendors.service;

import com.dgt.backend.vendors.dto.VendorContactResponse;
import com.dgt.backend.vendors.dto.CreateVendorContactRequest;
import com.dgt.backend.vendors.dto.UpdateVendorContactRequest;
import com.dgt.backend.vendors.entity.VendorContact;
import com.dgt.backend.vendors.repository.VendorContactRepository;
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
public class VendorContactService {
    private final VendorContactRepository repository;
    public VendorContactService(VendorContactRepository repository) { this.repository = repository; }

    public PageResponse<VendorContactResponse> list(int page, int size) {
        log.debug("Listing vendor contact page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("contactId")));
        log.debug("VendorContact list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(VendorContactResponse::from).toList(), page, size, p.getTotalElements());
    }

    public VendorContactResponse get(Long id) {
        log.debug("Fetching vendor contact id={}", id);
        return VendorContactResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("VendorContact not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public VendorContactResponse create(CreateVendorContactRequest req) {
        log.info("Creating vendor contact");
        var entity = VendorContact.builder()
                .vendorId(req.vendorId())
                .dgtId(req.dgtId())
                .contractNumber(req.contractNumber())
                .startDate(req.startDate())
                .endDate(req.endDate())
                .volumeThreshold(req.volumeThreshold())
                .volumeDiscountValue(req.volumeDiscountValue())
                .volumeDiscountType(req.volumeDiscountType())
                .returnWindowDays(req.returnWindowDays())
                .status(req.status())
                .documentUrl(req.documentUrl())
                .forceEndDate(req.forceEndDate())
                .build();
        var saved = repository.save(entity);
        log.info("Created vendor contact id={}", saved.getVendorContactId());
        return VendorContactResponse.from(saved);
    }

    @Transactional
    public VendorContactResponse update(Long id, UpdateVendorContactRequest req) {
        log.info("Updating vendor contact id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("VendorContact not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.vendorId() != null) entity.setVendorId(req.vendorId());
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.contractNumber() != null) entity.setContractNumber(req.contractNumber());
        if (req.startDate() != null) entity.setStartDate(req.startDate());
        if (req.endDate() != null) entity.setEndDate(req.endDate());
        if (req.volumeThreshold() != null) entity.setVolumeThreshold(req.volumeThreshold());
        if (req.volumeDiscountValue() != null) entity.setVolumeDiscountValue(req.volumeDiscountValue());
        if (req.volumeDiscountType() != null) entity.setVolumeDiscountType(req.volumeDiscountType());
        if (req.returnWindowDays() != null) entity.setReturnWindowDays(req.returnWindowDays());
        if (req.status() != null) entity.setStatus(req.status());
        if (req.documentUrl() != null) entity.setDocumentUrl(req.documentUrl());
        if (req.forceEndDate() != null) entity.setForceEndDate(req.forceEndDate());
        var saved = repository.save(entity);
        log.info("Updated vendor contact id={}", id);
        return VendorContactResponse.from(saved);
    }
}
