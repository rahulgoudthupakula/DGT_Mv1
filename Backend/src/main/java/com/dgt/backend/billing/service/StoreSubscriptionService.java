package com.dgt.backend.billing.service;

import com.dgt.backend.billing.dto.StoreSubscriptionResponse;
import com.dgt.backend.billing.dto.CreateStoreSubscriptionRequest;
import com.dgt.backend.billing.dto.UpdateStoreSubscriptionRequest;
import com.dgt.backend.billing.entity.StoreSubscription;
import com.dgt.backend.billing.repository.StoreSubscriptionRepository;
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
public class StoreSubscriptionService {
    private final StoreSubscriptionRepository repository;
    public StoreSubscriptionService(StoreSubscriptionRepository repository) { this.repository = repository; }

    public PageResponse<StoreSubscriptionResponse> list(int page, int size) {
        log.debug("Listing store subscription page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("subscriptionId")));
        log.debug("StoreSubscription list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(StoreSubscriptionResponse::from).toList(), page, size, p.getTotalElements());
    }

    public StoreSubscriptionResponse get(Long id) {
        log.debug("Fetching store subscription id={}", id);
        return StoreSubscriptionResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("StoreSubscription not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public StoreSubscriptionResponse create(CreateStoreSubscriptionRequest req) {
        log.info("Creating store subscription");
        var entity = StoreSubscription.builder()
                .storeId(req.storeId())
                .subscriptionPlanId(req.subscriptionPlanId())
                .subscriptionStatus(req.subscriptionStatus())
                .startDate(req.startDate())
                .currentPeriodStart(req.currentPeriodStart())
                .currentPeriodEnd(req.currentPeriodEnd())
                .nextBillingDate(req.nextBillingDate())
                .autoRenewal(req.autoRenewal())
                .cancelledAt(req.cancelledAt())
                .build();
        var saved = repository.save(entity);
        log.info("Created store subscription id={}", saved.getStoreSubscriptionId());
        return StoreSubscriptionResponse.from(saved);
    }

    @Transactional
    public StoreSubscriptionResponse update(Long id, UpdateStoreSubscriptionRequest req) {
        log.info("Updating store subscription id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("StoreSubscription not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.storeId() != null) entity.setStoreId(req.storeId());
        if (req.subscriptionPlanId() != null) entity.setSubscriptionPlanId(req.subscriptionPlanId());
        if (req.subscriptionStatus() != null) entity.setSubscriptionStatus(req.subscriptionStatus());
        if (req.startDate() != null) entity.setStartDate(req.startDate());
        if (req.currentPeriodStart() != null) entity.setCurrentPeriodStart(req.currentPeriodStart());
        if (req.currentPeriodEnd() != null) entity.setCurrentPeriodEnd(req.currentPeriodEnd());
        if (req.nextBillingDate() != null) entity.setNextBillingDate(req.nextBillingDate());
        if (req.autoRenewal() != null) entity.setAutoRenewal(req.autoRenewal());
        if (req.cancelledAt() != null) entity.setCancelledAt(req.cancelledAt());
        var saved = repository.save(entity);
        log.info("Updated store subscription id={}", id);
        return StoreSubscriptionResponse.from(saved);
    }
}
