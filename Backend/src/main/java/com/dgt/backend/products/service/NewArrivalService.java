package com.dgt.backend.products.service;

import com.dgt.backend.products.dto.NewArrivalResponse;
import com.dgt.backend.products.dto.CreateNewArrivalRequest;
import com.dgt.backend.products.dto.UpdateNewArrivalRequest;
import com.dgt.backend.products.entity.NewArrival;
import com.dgt.backend.products.repository.NewArrivalRepository;
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
public class NewArrivalService {
    private final NewArrivalRepository repository;
    public NewArrivalService(NewArrivalRepository repository) { this.repository = repository; }

    public PageResponse<NewArrivalResponse> list(int page, int size) {
        log.debug("Listing new arrival page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("newArrivalsId")));
        log.debug("NewArrival list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(NewArrivalResponse::from).toList(), page, size, p.getTotalElements());
    }

    public NewArrivalResponse get(Long id) {
        log.debug("Fetching new arrival id={}", id);
        return NewArrivalResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("NewArrival not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public NewArrivalResponse create(CreateNewArrivalRequest req) {
        log.info("Creating new arrival");
        var entity = NewArrival.builder()
                .invoiceItemId(req.invoiceItemId())
                .productName(req.productName())
                .departmentId(req.departmentId())
                .storeSubDepartmentId(req.storeSubDepartmentId())
                .suggestedRetailPrice(req.suggestedRetailPrice())
                .statusId(req.statusId())
                .build();
        var saved = repository.save(entity);
        log.info("Created new arrival id={}", saved.getNewArrivalId());
        return NewArrivalResponse.from(saved);
    }

    @Transactional
    public NewArrivalResponse update(Long id, UpdateNewArrivalRequest req) {
        log.info("Updating new arrival id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("NewArrival not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.invoiceItemId() != null) entity.setInvoiceItemId(req.invoiceItemId());
        if (req.productName() != null) entity.setProductName(req.productName());
        if (req.departmentId() != null) entity.setDepartmentId(req.departmentId());
        if (req.storeSubDepartmentId() != null) entity.setStoreSubDepartmentId(req.storeSubDepartmentId());
        if (req.suggestedRetailPrice() != null) entity.setSuggestedRetailPrice(req.suggestedRetailPrice());
        if (req.statusId() != null) entity.setStatusId(req.statusId());
        var saved = repository.save(entity);
        log.info("Updated new arrival id={}", id);
        return NewArrivalResponse.from(saved);
    }
}
