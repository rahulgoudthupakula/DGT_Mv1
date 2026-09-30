package com.dgt.backend.fuel.service;

import com.dgt.backend.fuel.dto.FuelInvoiceItemResponse;
import com.dgt.backend.fuel.dto.CreateFuelInvoiceItemRequest;
import com.dgt.backend.fuel.dto.UpdateFuelInvoiceItemRequest;
import com.dgt.backend.fuel.entity.FuelInvoiceItem;
import com.dgt.backend.fuel.repository.FuelInvoiceItemRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FuelInvoiceItemService {
    private final FuelInvoiceItemRepository repository;
    public FuelInvoiceItemService(FuelInvoiceItemRepository repository) { this.repository = repository; }

    public PageResponse<FuelInvoiceItemResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("fuelInvoiceItemId")));
        return new PageResponse<>(p.getContent().stream().map(FuelInvoiceItemResponse::from).toList(), page, size, p.getTotalElements());
    }

    public FuelInvoiceItemResponse get(Long id) {
        return FuelInvoiceItemResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public FuelInvoiceItemResponse create(CreateFuelInvoiceItemRequest req) {
        var entity = FuelInvoiceItem.builder()
                .invoiceId(req.invoiceId())
                .fuelGradeId(req.fuelGradeId())
                .grossGallons(req.grossGallons())
                .netGallons(req.netGallons())
                .pricePerGallon(req.pricePerGallon())
                .fuelLineTotal(req.fuelLineTotal())
                .build();
        return FuelInvoiceItemResponse.from(repository.save(entity));
    }

    @Transactional
    public FuelInvoiceItemResponse update(Long id, UpdateFuelInvoiceItemRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.invoiceId() != null) entity.setInvoiceId(req.invoiceId());
        if (req.fuelGradeId() != null) entity.setFuelGradeId(req.fuelGradeId());
        if (req.grossGallons() != null) entity.setGrossGallons(req.grossGallons());
        if (req.netGallons() != null) entity.setNetGallons(req.netGallons());
        if (req.pricePerGallon() != null) entity.setPricePerGallon(req.pricePerGallon());
        if (req.fuelLineTotal() != null) entity.setFuelLineTotal(req.fuelLineTotal());
        return FuelInvoiceItemResponse.from(repository.save(entity));
    }
}
