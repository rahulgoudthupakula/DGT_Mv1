package com.dgt.backend.stores.service;

import com.dgt.backend.stores.dto.StoreContactInfoResponse;
import com.dgt.backend.stores.dto.CreateStoreContactInfoRequest;
import com.dgt.backend.stores.dto.UpdateStoreContactInfoRequest;
import com.dgt.backend.stores.entity.StoreContactInfo;
import com.dgt.backend.stores.repository.StoreContactInfoRepository;
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
public class StoreContactInfoService {
    private final StoreContactInfoRepository repository;
    public StoreContactInfoService(StoreContactInfoRepository repository) { this.repository = repository; }

    public PageResponse<StoreContactInfoResponse> list(int page, int size) {
        log.debug("Listing store contact info page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("contactInfoId")));
        log.debug("StoreContactInfo list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(StoreContactInfoResponse::from).toList(), page, size, p.getTotalElements());
    }

    public StoreContactInfoResponse get(Long id) {
        log.debug("Fetching store contact info id={}", id);
        return StoreContactInfoResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("StoreContactInfo not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public StoreContactInfoResponse create(CreateStoreContactInfoRequest req) {
        log.info("Creating store contact info");
        var entity = StoreContactInfo.builder()
                .dgtId(req.dgtId())
                .phoneNumber(req.phoneNumber())
                .email(req.email())
                .address(req.address())
                .storeName(req.storeName())
                .build();
        var saved = repository.save(entity);
        log.info("Created store contact info id={}", saved.getStoreContactInfoId());
        return StoreContactInfoResponse.from(saved);
    }

    @Transactional
    public StoreContactInfoResponse update(Long id, UpdateStoreContactInfoRequest req) {
        log.info("Updating store contact info id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("StoreContactInfo not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.phoneNumber() != null) entity.setPhoneNumber(req.phoneNumber());
        if (req.email() != null) entity.setEmail(req.email());
        if (req.address() != null) entity.setAddress(req.address());
        if (req.storeName() != null) entity.setStoreName(req.storeName());
        var saved = repository.save(entity);
        log.info("Updated store contact info id={}", id);
        return StoreContactInfoResponse.from(saved);
    }
}
