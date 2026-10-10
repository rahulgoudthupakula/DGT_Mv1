package com.dgt.backend.billing.service;

import com.dgt.backend.billing.dto.*;
import com.dgt.backend.billing.entity.StoreSubscription;
import com.dgt.backend.billing.repository.StoreSubscriptionRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StoreSubscriptionServiceTest {

    @Mock StoreSubscriptionRepository repository;
    @InjectMocks StoreSubscriptionService service;

    private StoreSubscription sampleEntity() {
        return StoreSubscription.builder()
            .subscriptionId(1L)
            .storeId("DGT-S1")
            .subscriptionPlanId(2L)
            .subscriptionStatus("ACTIVE")
            .startDate(LocalDate.of(2025, 1, 1))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        var pageData = new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1);
        when(repository.findAll(any(Pageable.class))).thenReturn(pageData);
        PageResponse<StoreSubscriptionResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        StoreSubscriptionResponse result = service.get(1L);
        assertThat(result.subscriptionId()).isEqualTo(1L);
        assertThat(result.storeId()).isEqualTo("DGT-S1");
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
        var req = new CreateStoreSubscriptionRequest("DGT-S1", 2L, "ACTIVE", LocalDate.of(2025,1,1), null, null, null, true, null);
        when(repository.save(any(StoreSubscription.class))).thenReturn(sampleEntity());
        StoreSubscriptionResponse result = service.create(req);
        assertThat(result.subscriptionId()).isEqualTo(1L);
        verify(repository).save(any(StoreSubscription.class));
    }

    @Test
    void update_existingId_appliesChanges() {
        var req = new UpdateStoreSubscriptionRequest(null, null, "CANCELLED", null, null, null, null, null, null);
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        StoreSubscriptionResponse result = service.update(1L, req);
        assertThat(result).isNotNull();
        verify(repository).save(entity);
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        var req = new UpdateStoreSubscriptionRequest(null, null, null, null, null, null, null, null, null);
        assertThatThrownBy(() -> service.update(99L, req))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
