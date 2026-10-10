package com.dgt.backend.inventory.service;

import com.dgt.backend.inventory.dto.*;
import com.dgt.backend.inventory.entity.Inventory;
import com.dgt.backend.inventory.repository.InventoryRepository;
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
class InventoryServiceTest {

    @Mock InventoryRepository repository;
    @InjectMocks InventoryService service;

    private Inventory sampleEntity() {
        return Inventory.builder()
            .inventoryId(1L)
            .dgtId("DGT-1001")
            .productId(10L)
            .availableQuantity(new BigDecimal("100.000"))
            .cost(new BigDecimal("5.00"))
            .returnCost(new BigDecimal("3.00"))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        var entity = sampleEntity();
        var pageData = new PageImpl<>(List.of(entity), PageRequest.of(0, 50), 1);
        when(repository.findAll(any(Pageable.class))).thenReturn(pageData);

        PageResponse<InventoryResponse> result = service.list(0, 50);

        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
        assertThat(result.page()).isEqualTo(0);
        assertThat(result.size()).isEqualTo(50);
    }

    @Test
    void list_emptyRepository_returnsEmptyPage() {
        when(repository.findAll(any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of()));
        PageResponse<InventoryResponse> result = service.list(0, 50);
        assertThat(result.items()).isEmpty();
        assertThat(result.total()).isEqualTo(0L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        InventoryResponse result = service.get(1L);
        assertThat(result.inventoryId()).isEqualTo(1L);
        assertThat(result.dgtId()).isEqualTo("DGT-1001");
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
    void create_validRequest_savesAndReturnsResponse() {
        var req = new CreateInventoryRequest("DGT-1001", 10L, new BigDecimal("100.000"), new BigDecimal("5.00"), new BigDecimal("3.00"));
        when(repository.save(any(Inventory.class))).thenReturn(sampleEntity());

        InventoryResponse result = service.create(req);

        assertThat(result.inventoryId()).isEqualTo(1L);
        verify(repository).save(any(Inventory.class));
    }

    @Test
    void update_existingId_appliesChangesAndReturns() {
        var req = new UpdateInventoryRequest(null, null, new BigDecimal("200.000"), null, null);
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);

        InventoryResponse result = service.update(1L, req);

        assertThat(result).isNotNull();
        verify(repository).save(entity);
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        var req = new UpdateInventoryRequest(null, null, null, null, null);
        assertThatThrownBy(() -> service.update(99L, req))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void update_nullFields_doesNotOverwrite() {
        var req = new UpdateInventoryRequest(null, null, null, null, null);
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        service.update(1L, req);
        assertThat(entity.getDgtId()).isEqualTo("DGT-1001");
    }
}
