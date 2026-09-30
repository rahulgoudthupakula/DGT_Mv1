package com.dgt.backend.billing.service;

import com.dgt.backend.billing.dto.SubscriptionPlanResponse;
import com.dgt.backend.billing.dto.CreateSubscriptionPlanRequest;
import com.dgt.backend.billing.dto.UpdateSubscriptionPlanRequest;
import com.dgt.backend.billing.entity.SubscriptionPlan;
import com.dgt.backend.billing.repository.SubscriptionPlanRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SubscriptionPlanService {
    private final SubscriptionPlanRepository repository;
    public SubscriptionPlanService(SubscriptionPlanRepository repository) { this.repository = repository; }

    public PageResponse<SubscriptionPlanResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("subscriptionPlanId")));
        return new PageResponse<>(p.getContent().stream().map(SubscriptionPlanResponse::from).toList(), page, size, p.getTotalElements());
    }

    public SubscriptionPlanResponse get(Long id) {
        return SubscriptionPlanResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public SubscriptionPlanResponse create(CreateSubscriptionPlanRequest req) {
        var entity = SubscriptionPlan.builder()
                .planName(req.planName())
                .monthlyPrice(req.monthlyPrice())
                .build();
        return SubscriptionPlanResponse.from(repository.save(entity));
    }

    @Transactional
    public SubscriptionPlanResponse update(Long id, UpdateSubscriptionPlanRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.planName() != null) entity.setPlanName(req.planName());
        if (req.monthlyPrice() != null) entity.setMonthlyPrice(req.monthlyPrice());
        return SubscriptionPlanResponse.from(repository.save(entity));
    }
}
