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

@Service
public class StoreSubscriptionService {
    private final StoreSubscriptionRepository repository;
    public StoreSubscriptionService(StoreSubscriptionRepository repository) { this.repository = repository; }

    public PageResponse<StoreSubscriptionResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("subscriptionId")));
        return new PageResponse<>(p.getContent().stream().map(StoreSubscriptionResponse::from).toList(), page, size, p.getTotalElements());
    }

    public StoreSubscriptionResponse get(Long id) {
        return StoreSubscriptionResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public StoreSubscriptionResponse create(CreateStoreSubscriptionRequest req) {
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
        return StoreSubscriptionResponse.from(repository.save(entity));
    }

    @Transactional
    public StoreSubscriptionResponse update(Long id, UpdateStoreSubscriptionRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.storeId() != null) entity.setStoreId(req.storeId());
        if (req.subscriptionPlanId() != null) entity.setSubscriptionPlanId(req.subscriptionPlanId());
        if (req.subscriptionStatus() != null) entity.setSubscriptionStatus(req.subscriptionStatus());
        if (req.startDate() != null) entity.setStartDate(req.startDate());
        if (req.currentPeriodStart() != null) entity.setCurrentPeriodStart(req.currentPeriodStart());
        if (req.currentPeriodEnd() != null) entity.setCurrentPeriodEnd(req.currentPeriodEnd());
        if (req.nextBillingDate() != null) entity.setNextBillingDate(req.nextBillingDate());
        if (req.autoRenewal() != null) entity.setAutoRenewal(req.autoRenewal());
        if (req.cancelledAt() != null) entity.setCancelledAt(req.cancelledAt());
        return StoreSubscriptionResponse.from(repository.save(entity));
    }
}
