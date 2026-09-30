package com.dgt.backend.fuel.service;

import com.dgt.backend.fuel.dto.FuelInvoiceDetailResponse;
import com.dgt.backend.fuel.dto.CreateFuelInvoiceDetailRequest;
import com.dgt.backend.fuel.dto.UpdateFuelInvoiceDetailRequest;
import com.dgt.backend.fuel.entity.FuelInvoiceDetail;
import com.dgt.backend.fuel.repository.FuelInvoiceDetailRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FuelInvoiceDetailService {
    private final FuelInvoiceDetailRepository repository;
    public FuelInvoiceDetailService(FuelInvoiceDetailRepository repository) { this.repository = repository; }

    public PageResponse<FuelInvoiceDetailResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("fuelInvoiceDetailsId")));
        return new PageResponse<>(p.getContent().stream().map(FuelInvoiceDetailResponse::from).toList(), page, size, p.getTotalElements());
    }

    public FuelInvoiceDetailResponse get(Long id) {
        return FuelInvoiceDetailResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public FuelInvoiceDetailResponse create(CreateFuelInvoiceDetailRequest req) {
        var entity = FuelInvoiceDetail.builder()
                .invoiceId(req.invoiceId())
                .deliveryNumber(req.deliveryNumber())
                .billOfLadingNumber(req.billOfLadingNumber())
                .carrierName(req.carrierName())
                .deliveryDate(req.deliveryDate())
                .totalGallons(req.totalGallons())
                .fuelSubtotal(req.fuelSubtotal())
                .freightAmount(req.freightAmount())
                .build();
        return FuelInvoiceDetailResponse.from(repository.save(entity));
    }

    @Transactional
    public FuelInvoiceDetailResponse update(Long id, UpdateFuelInvoiceDetailRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.invoiceId() != null) entity.setInvoiceId(req.invoiceId());
        if (req.deliveryNumber() != null) entity.setDeliveryNumber(req.deliveryNumber());
        if (req.billOfLadingNumber() != null) entity.setBillOfLadingNumber(req.billOfLadingNumber());
        if (req.carrierName() != null) entity.setCarrierName(req.carrierName());
        if (req.deliveryDate() != null) entity.setDeliveryDate(req.deliveryDate());
        if (req.totalGallons() != null) entity.setTotalGallons(req.totalGallons());
        if (req.fuelSubtotal() != null) entity.setFuelSubtotal(req.fuelSubtotal());
        if (req.freightAmount() != null) entity.setFreightAmount(req.freightAmount());
        return FuelInvoiceDetailResponse.from(repository.save(entity));
    }
}
