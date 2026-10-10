package com.dgt.backend.inventory.service;

import com.dgt.backend.inventory.dto.*;
import com.dgt.backend.inventory.entity.InventoryTransferItem;
import com.dgt.backend.inventory.repository.InventoryTransferItemRepository;
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
class InventoryTransferItemServiceTest {

    @Mock InventoryTransferItemRepository repository;
    @InjectMocks InventoryTransferItemService service;

    private InventoryTransferItem sampleEntity() {
        return InventoryTransferItem.builder()
            .transferItemId(1L)
            .transferId(1L)
            .productId(1L)
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<InventoryTransferItemResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        InventoryTransferItemResponse result = service.get(1L);
        assertThat(result.transferItemId()).isEqualTo(1L);
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
    void create_savesAndReturnsResponse() {
        var req = new CreateInventoryTransferItemRequest(1L, 1L, new BigDecimal("1.000"),
                new BigDecimal("1.000"), new BigDecimal("1.00"));
        when(repository.save(any(InventoryTransferItem.class))).thenReturn(sampleEntity());
        InventoryTransferItemResponse result = service.create(req);
        assertThat(result.transferItemId()).isEqualTo(1L);
        verify(repository).save(any(InventoryTransferItem.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateInventoryTransferItemRequest(null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
