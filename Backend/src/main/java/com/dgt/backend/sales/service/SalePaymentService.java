package com.dgt.backend.sales.service;

import com.dgt.backend.sales.dto.SalePaymentResponse;
import com.dgt.backend.sales.dto.CreateSalePaymentRequest;
import com.dgt.backend.sales.dto.UpdateSalePaymentRequest;
import com.dgt.backend.sales.entity.SalePayment;
import com.dgt.backend.sales.repository.SalePaymentRepository;
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
// Coordinate sale payment persistence and response mapping; caller authorization is handled at the controller.
public class SalePaymentService {
    private final SalePaymentRepository repository;
    public SalePaymentService(SalePaymentRepository repository) { this.repository = repository; }

    // Read a page sorted by primary key and include the total record count.
    public PageResponse<SalePaymentResponse> list(int page, int size) {
        log.debug("Listing sale payment page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("salePaymentId")));
        log.debug("SalePayment list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(SalePaymentResponse::from).toList(), page, size, p.getTotalElements());
    }

    // Map the stored record to the API response, or return HTTP 404 when absent.
    public SalePaymentResponse get(Long id) {
        log.debug("Fetching sale payment id={}", id);
        return SalePaymentResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("SalePayment not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    // Build and save a record from the submitted create fields inside the transaction.
    public SalePaymentResponse create(CreateSalePaymentRequest req) {
        log.info("Creating sale payment");
        var entity = SalePayment.builder()
                .saleId(req.saleId())
                .tenderTypeId(req.tenderTypeId())
                .paymentAmount(req.paymentAmount())
                .paymentStatus(req.paymentStatus())
                .cardBrand(req.cardBrand())
                .cardLast4(req.cardLast4())
                .processorReference(req.processorReference())
                .authorizationCode(req.authorizationCode())
                .paymentDatetime(req.paymentDatetime())
                .build();
        var saved = repository.save(entity);
        log.info("Created sale payment id={}", saved.getSalePaymentId());
        return SalePaymentResponse.from(saved);
    }

    @Transactional
    // Load the existing record and apply only non-null fields; null does not clear a stored value.
    public SalePaymentResponse update(Long id, UpdateSalePaymentRequest req) {
        log.info("Updating sale payment id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("SalePayment not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.saleId() != null) entity.setSaleId(req.saleId());
        if (req.tenderTypeId() != null) entity.setTenderTypeId(req.tenderTypeId());
        if (req.paymentAmount() != null) entity.setPaymentAmount(req.paymentAmount());
        if (req.paymentStatus() != null) entity.setPaymentStatus(req.paymentStatus());
        if (req.cardBrand() != null) entity.setCardBrand(req.cardBrand());
        if (req.cardLast4() != null) entity.setCardLast4(req.cardLast4());
        if (req.processorReference() != null) entity.setProcessorReference(req.processorReference());
        if (req.authorizationCode() != null) entity.setAuthorizationCode(req.authorizationCode());
        if (req.paymentDatetime() != null) entity.setPaymentDatetime(req.paymentDatetime());
        var saved = repository.save(entity);
        log.info("Updated sale payment id={}", id);
        return SalePaymentResponse.from(saved);
    }
}
