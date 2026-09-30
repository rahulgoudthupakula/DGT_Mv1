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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SubscriptionPlanService {
    private final SubscriptionPlanRepository repository;
    public SubscriptionPlanService(SubscriptionPlanRepository repository) { this.repository = repository; }

    public PageResponse<SubscriptionPlanResponse> list(int page, int size) {
        log.debug("Listing subscription plan page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("subscriptionPlanId")));
        log.debug("SubscriptionPlan list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(SubscriptionPlanResponse::from).toList(), page, size, p.getTotalElements());
    }

    public SubscriptionPlanResponse get(Long id) {
        log.debug("Fetching subscription plan id={}", id);
        return SubscriptionPlanResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("SubscriptionPlan not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public SubscriptionPlanResponse create(CreateSubscriptionPlanRequest req) {
        log.info("Creating subscription plan");
        var entity = SubscriptionPlan.builder()
                .planName(req.planName())
                .monthlyPrice(req.monthlyPrice())
                .build();
        var saved = repository.save(entity);
        log.info("Created subscription plan id={}", saved.getSubscriptionPlanId());
        return SubscriptionPlanResponse.from(saved);
    }

    @Transactional
    public SubscriptionPlanResponse update(Long id, UpdateSubscriptionPlanRequest req) {
        log.info("Updating subscription plan id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("SubscriptionPlan not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.planName() != null) entity.setPlanName(req.planName());
        if (req.monthlyPrice() != null) entity.setMonthlyPrice(req.monthlyPrice());
        var saved = repository.save(entity);
        log.info("Updated subscription plan id={}", id);
        return SubscriptionPlanResponse.from(saved);
    }
}
