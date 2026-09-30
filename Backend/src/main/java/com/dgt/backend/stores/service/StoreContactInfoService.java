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

@Service
public class StoreContactInfoService {
    private final StoreContactInfoRepository repository;
    public StoreContactInfoService(StoreContactInfoRepository repository) { this.repository = repository; }

    public PageResponse<StoreContactInfoResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("contactInfoId")));
        return new PageResponse<>(p.getContent().stream().map(StoreContactInfoResponse::from).toList(), page, size, p.getTotalElements());
    }

    public StoreContactInfoResponse get(Long id) {
        return StoreContactInfoResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public StoreContactInfoResponse create(CreateStoreContactInfoRequest req) {
        var entity = StoreContactInfo.builder()
                .dgtId(req.dgtId())
                .phoneNumber(req.phoneNumber())
                .email(req.email())
                .address(req.address())
                .storeName(req.storeName())
                .build();
        return StoreContactInfoResponse.from(repository.save(entity));
    }

    @Transactional
    public StoreContactInfoResponse update(Long id, UpdateStoreContactInfoRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.phoneNumber() != null) entity.setPhoneNumber(req.phoneNumber());
        if (req.email() != null) entity.setEmail(req.email());
        if (req.address() != null) entity.setAddress(req.address());
        if (req.storeName() != null) entity.setStoreName(req.storeName());
        return StoreContactInfoResponse.from(repository.save(entity));
    }
}
