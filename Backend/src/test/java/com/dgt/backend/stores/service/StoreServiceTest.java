package com.dgt.backend.stores.service;

import com.dgt.backend.stores.dto.*;
import com.dgt.backend.stores.entity.Store;
import com.dgt.backend.stores.repository.StoreRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StoreServiceTest {

    @Mock StoreRepository repository;
    @InjectMocks StoreService service;

    private Store sampleEntity() {
        return Store.builder()
            .dgtId("DGT-S1")
            .storeId("S001")
            .storeName("Test Store")
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        var pageData = new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1);
        when(repository.findAll(any(Pageable.class))).thenReturn(pageData);
        PageResponse<StoreResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById("DGT-S1")).thenReturn(Optional.of(sampleEntity()));
        StoreResponse result = service.get("DGT-S1");
        assertThat(result.dgtId()).isEqualTo("DGT-S1");
        assertThat(result.storeName()).isEqualTo("Test Store");
    }

    @Test
    void get_nonExistingId_throwsNotFound() {
        when(repository.findById("INVALID")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.get("INVALID"))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void create_savesAndReturns() {
        var req = new CreateStoreRequest("DGT-S1", "S001", "Test Store", null, null, null, "America/New_York", null);
        when(repository.save(any(Store.class))).thenReturn(sampleEntity());
        StoreResponse result = service.create(req);
        assertThat(result.storeName()).isEqualTo("Test Store");
        verify(repository).save(any(Store.class));
    }

    @Test
    void update_existingId_appliesChanges() {
        var req = new UpdateStoreRequest(null, "Updated Store", null, null, null, null, null);
        var entity = sampleEntity();
        when(repository.findById("DGT-S1")).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        assertThat(service.update("DGT-S1", req)).isNotNull();
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById("INVALID")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update("INVALID", new UpdateStoreRequest(null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
