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

@Service
public class NewArrivalService {
    private final NewArrivalRepository repository;
    public NewArrivalService(NewArrivalRepository repository) { this.repository = repository; }

    public PageResponse<NewArrivalResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("newArrivalsId")));
        return new PageResponse<>(p.getContent().stream().map(NewArrivalResponse::from).toList(), page, size, p.getTotalElements());
    }

    public NewArrivalResponse get(Long id) {
        return NewArrivalResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public NewArrivalResponse create(CreateNewArrivalRequest req) {
        var entity = NewArrival.builder()
                .invoiceItemId(req.invoiceItemId())
                .productName(req.productName())
                .departmentId(req.departmentId())
                .storeSubDepartmentId(req.storeSubDepartmentId())
                .suggestedRetailPrice(req.suggestedRetailPrice())
                .statusId(req.statusId())
                .build();
        return NewArrivalResponse.from(repository.save(entity));
    }

    @Transactional
    public NewArrivalResponse update(Long id, UpdateNewArrivalRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.invoiceItemId() != null) entity.setInvoiceItemId(req.invoiceItemId());
        if (req.productName() != null) entity.setProductName(req.productName());
        if (req.departmentId() != null) entity.setDepartmentId(req.departmentId());
        if (req.storeSubDepartmentId() != null) entity.setStoreSubDepartmentId(req.storeSubDepartmentId());
        if (req.suggestedRetailPrice() != null) entity.setSuggestedRetailPrice(req.suggestedRetailPrice());
        if (req.statusId() != null) entity.setStatusId(req.statusId());
        return NewArrivalResponse.from(repository.save(entity));
    }
}
