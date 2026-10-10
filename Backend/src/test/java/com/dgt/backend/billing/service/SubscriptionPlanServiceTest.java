package com.dgt.backend.billing.service;

import com.dgt.backend.billing.dto.*;
import com.dgt.backend.billing.entity.SubscriptionPlan;
import com.dgt.backend.billing.repository.SubscriptionPlanRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionPlanServiceTest {

    @Mock SubscriptionPlanRepository repository;
    @InjectMocks SubscriptionPlanService service;

    private SubscriptionPlan sampleEntity() {
        return SubscriptionPlan.builder()
            .subscriptionPlanId(1L)
            .planName("Basic Plan")
            .monthlyPrice(new BigDecimal("29.99"))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        var pageData = new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1);
        when(repository.findAll(any(Pageable.class))).thenReturn(pageData);
        PageResponse<SubscriptionPlanResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        SubscriptionPlanResponse result = service.get(1L);
        assertThat(result.subscriptionPlanId()).isEqualTo(1L);
        assertThat(result.planName()).isEqualTo("Basic Plan");
    }

    @Test
    void get_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.get(99L))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void create_savesAndReturns() {
        var req = new CreateSubscriptionPlanRequest("Basic Plan", new BigDecimal("29.99"));
        when(repository.save(any(SubscriptionPlan.class))).thenReturn(sampleEntity());
        SubscriptionPlanResponse result = service.create(req);
        assertThat(result.planName()).isEqualTo("Basic Plan");
        verify(repository).save(any(SubscriptionPlan.class));
    }

    @Test
    void update_existingId_appliesChanges() {
        var req = new UpdateSubscriptionPlanRequest("Premium Plan", new BigDecimal("49.99"));
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        SubscriptionPlanResponse result = service.update(1L, req);
        assertThat(result).isNotNull();
        verify(repository).save(entity);
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        var req = new UpdateSubscriptionPlanRequest(null, null);
        assertThatThrownBy(() -> service.update(99L, req))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
