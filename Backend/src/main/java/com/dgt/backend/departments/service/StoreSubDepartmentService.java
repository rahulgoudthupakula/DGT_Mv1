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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class StoreSubDepartmentService {
    private final StoreSubDepartmentRepository repository;
    public StoreSubDepartmentService(StoreSubDepartmentRepository repository) { this.repository = repository; }

    public PageResponse<StoreSubDepartmentResponse> list(int page, int size) {
        log.debug("Listing store sub department page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("storeSubDepartmentId")));
        log.debug("StoreSubDepartment list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(StoreSubDepartmentResponse::from).toList(), page, size, p.getTotalElements());
    }

    public StoreSubDepartmentResponse get(Long id) {
        log.debug("Fetching store sub department id={}", id);
        return StoreSubDepartmentResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("StoreSubDepartment not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public StoreSubDepartmentResponse create(CreateStoreSubDepartmentRequest req) {
        log.info("Creating store sub department");
        var entity = StoreSubDepartment.builder()
                .storeDepartmentId(req.storeDepartmentId())
                .storeSubDepartmentName(req.storeSubDepartmentName())
                .isTaxable(req.isTaxable())
                .isActive(req.isActive())
                .sourceType(req.sourceType())
                .build();
        var saved = repository.save(entity);
        log.info("Created store sub department id={}", saved.getStoreSubDepartmentId());
        return StoreSubDepartmentResponse.from(saved);
    }

    @Transactional
    public StoreSubDepartmentResponse update(Long id, UpdateStoreSubDepartmentRequest req) {
        log.info("Updating store sub department id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("StoreSubDepartment not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.storeDepartmentId() != null) entity.setStoreDepartmentId(req.storeDepartmentId());
        if (req.storeSubDepartmentName() != null) entity.setStoreSubDepartmentName(req.storeSubDepartmentName());
        if (req.isTaxable() != null) entity.setIsTaxable(req.isTaxable());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        if (req.sourceType() != null) entity.setSourceType(req.sourceType());
        var saved = repository.save(entity);
        log.info("Updated store sub department id={}", id);
        return StoreSubDepartmentResponse.from(saved);
    }
}
