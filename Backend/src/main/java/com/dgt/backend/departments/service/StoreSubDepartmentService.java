package com.dgt.backend.departments.service;

import com.dgt.backend.departments.dto.StoreSubDepartmentResponse;
import com.dgt.backend.departments.dto.CreateStoreSubDepartmentRequest;
import com.dgt.backend.departments.dto.UpdateStoreSubDepartmentRequest;
import com.dgt.backend.departments.entity.StoreSubDepartment;
import com.dgt.backend.departments.repository.StoreSubDepartmentRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StoreSubDepartmentService {
    private final StoreSubDepartmentRepository repository;
    public StoreSubDepartmentService(StoreSubDepartmentRepository repository) { this.repository = repository; }

    public PageResponse<StoreSubDepartmentResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("storeSubDepartmentId")));
        return new PageResponse<>(p.getContent().stream().map(StoreSubDepartmentResponse::from).toList(), page, size, p.getTotalElements());
    }

    public StoreSubDepartmentResponse get(Long id) {
        return StoreSubDepartmentResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public StoreSubDepartmentResponse create(CreateStoreSubDepartmentRequest req) {
        var entity = StoreSubDepartment.builder()
                .storeDepartmentId(req.storeDepartmentId())
                .storeSubDepartmentName(req.storeSubDepartmentName())
                .isTaxable(req.isTaxable())
                .isActive(req.isActive())
                .sourceType(req.sourceType())
                .build();
        return StoreSubDepartmentResponse.from(repository.save(entity));
    }

    @Transactional
    public StoreSubDepartmentResponse update(Long id, UpdateStoreSubDepartmentRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.storeDepartmentId() != null) entity.setStoreDepartmentId(req.storeDepartmentId());
        if (req.storeSubDepartmentName() != null) entity.setStoreSubDepartmentName(req.storeSubDepartmentName());
        if (req.isTaxable() != null) entity.setIsTaxable(req.isTaxable());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        if (req.sourceType() != null) entity.setSourceType(req.sourceType());
        return StoreSubDepartmentResponse.from(repository.save(entity));
    }
}
