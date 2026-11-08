package com.dgt.backend.stores.service;

import com.dgt.backend.stores.dto.StoreResponse;
import com.dgt.backend.stores.dto.CreateStoreRequest;
import com.dgt.backend.stores.dto.UpdateStoreRequest;
import com.dgt.backend.stores.entity.Store;
import com.dgt.backend.stores.repository.StoreRepository;
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
// Coordinate store persistence and response mapping; caller authorization is handled at the controller.
public class StoreService {
    private final StoreRepository repository;
    public StoreService(StoreRepository repository) { this.repository = repository; }

    // Read a page sorted by primary key and include the total record count.
    public PageResponse<StoreResponse> list(int page, int size) {
        log.debug("Listing store page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("dgtId")));
        log.debug("Store list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(StoreResponse::from).toList(), page, size, p.getTotalElements());
    }

    // Map the stored record to the API response, or return HTTP 404 when absent.
    public StoreResponse get(String id) {
        return StoreResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    // Build and save a record from the submitted create fields inside the transaction.
    public StoreResponse create(CreateStoreRequest req) {
        log.info("Creating store");
        var entity = Store.builder()
                .dgtId(req.dgtId())
                .storeId(req.storeId())
                .storeName(req.storeName())
                .legalBusinessName(req.legalBusinessName())
                .taxId(req.taxId())
                .licenseNumber(req.licenseNumber())
                .timezone(req.timezone())
                .companyId(req.companyId())
                .build();
        var saved = repository.save(entity);
        log.info("Created store id={}", saved.getStoreId());
        return StoreResponse.from(saved);
    }

    @Transactional
    // Load the existing record and apply only non-null fields; null does not clear a stored value.
    public StoreResponse update(String id, UpdateStoreRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.storeId() != null) entity.setStoreId(req.storeId());
        if (req.storeName() != null) entity.setStoreName(req.storeName());
        if (req.legalBusinessName() != null) entity.setLegalBusinessName(req.legalBusinessName());
        if (req.taxId() != null) entity.setTaxId(req.taxId());
        if (req.licenseNumber() != null) entity.setLicenseNumber(req.licenseNumber());
        if (req.timezone() != null) entity.setTimezone(req.timezone());
        if (req.companyId() != null) entity.setCompanyId(req.companyId());
        return StoreResponse.from(repository.save(entity));
    }
}
