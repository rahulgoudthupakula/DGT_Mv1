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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class FuelInvoiceItemService {
    private final FuelInvoiceItemRepository repository;
    public FuelInvoiceItemService(FuelInvoiceItemRepository repository) { this.repository = repository; }

    public PageResponse<FuelInvoiceItemResponse> list(int page, int size) {
        log.debug("Listing fuel invoice item page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("fuelInvoiceItemId")));
        log.debug("FuelInvoiceItem list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(FuelInvoiceItemResponse::from).toList(), page, size, p.getTotalElements());
    }

    public FuelInvoiceItemResponse get(Long id) {
        log.debug("Fetching fuel invoice item id={}", id);
        return FuelInvoiceItemResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("FuelInvoiceItem not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public FuelInvoiceItemResponse create(CreateFuelInvoiceItemRequest req) {
        log.info("Creating fuel invoice item");
        var entity = FuelInvoiceItem.builder()
                .invoiceId(req.invoiceId())
                .fuelGradeId(req.fuelGradeId())
                .grossGallons(req.grossGallons())
                .netGallons(req.netGallons())
                .pricePerGallon(req.pricePerGallon())
                .fuelLineTotal(req.fuelLineTotal())
                .build();
        var saved = repository.save(entity);
        log.info("Created fuel invoice item id={}", saved.getFuelInvoiceItemId());
        return FuelInvoiceItemResponse.from(saved);
    }

    @Transactional
    public FuelInvoiceItemResponse update(Long id, UpdateFuelInvoiceItemRequest req) {
        log.info("Updating fuel invoice item id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("FuelInvoiceItem not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.invoiceId() != null) entity.setInvoiceId(req.invoiceId());
        if (req.fuelGradeId() != null) entity.setFuelGradeId(req.fuelGradeId());
        if (req.grossGallons() != null) entity.setGrossGallons(req.grossGallons());
        if (req.netGallons() != null) entity.setNetGallons(req.netGallons());
        if (req.pricePerGallon() != null) entity.setPricePerGallon(req.pricePerGallon());
        if (req.fuelLineTotal() != null) entity.setFuelLineTotal(req.fuelLineTotal());
        var saved = repository.save(entity);
        log.info("Updated fuel invoice item id={}", id);
        return FuelInvoiceItemResponse.from(saved);
    }
}
