package com.dgt.backend.inventory.service;

import com.dgt.backend.inventory.dto.*;
import com.dgt.backend.inventory.entity.InventoryShrinkageItem;
import com.dgt.backend.inventory.repository.InventoryShrinkageItemRepository;
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
class InventoryShrinkageItemServiceTest {

    @Mock InventoryShrinkageItemRepository repository;
    @InjectMocks InventoryShrinkageItemService service;

    private InventoryShrinkageItem sampleEntity() {
        return InventoryShrinkageItem.builder()
            .shrinkageItemId(1L)
            .shrinkageId(1L)
            .productId(1L)
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<InventoryShrinkageItemResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        InventoryShrinkageItemResponse result = service.get(1L);
        assertThat(result.shrinkageItemId()).isEqualTo(1L);
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
        var req = new CreateInventoryShrinkageItemRequest(1L, 1L, new BigDecimal("1.000"),
                new BigDecimal("1.00"), new BigDecimal("1.00"), "SAMPLE");
        when(repository.save(any(InventoryShrinkageItem.class))).thenReturn(sampleEntity());
        InventoryShrinkageItemResponse result = service.create(req);
        assertThat(result.shrinkageItemId()).isEqualTo(1L);
        verify(repository).save(any(InventoryShrinkageItem.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateInventoryShrinkageItemRequest(null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
