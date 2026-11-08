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

/**
 * JPA CRUD operations for SubscriptionPlan records.
 * Authorization is applied by the controller; these repository calls do not add store filtering.
 * Renewal and plan-change calculations belong to StoreBilling.
 */

@Slf4j
@Service
public class SubscriptionPlanService {
    private final SubscriptionPlanRepository repository;
    public SubscriptionPlanService(SubscriptionPlanRepository repository) { this.repository = repository; }

    /** Read a page sorted by the primary key and map entities to response DTOs. */
    public PageResponse<SubscriptionPlanResponse> list(int page, int size) {
        log.debug("Listing subscription plan page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("subscriptionPlanId")));
        log.debug("SubscriptionPlan list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(SubscriptionPlanResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load one record or return HTTP 404 when the identifier is unknown. */
    public SubscriptionPlanResponse get(Long id) {
        log.debug("Fetching subscription plan id={}", id);
        return SubscriptionPlanResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("SubscriptionPlan not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
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

    /** Update only non-null request fields in one transaction; omitted fields stay unchanged. */
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
