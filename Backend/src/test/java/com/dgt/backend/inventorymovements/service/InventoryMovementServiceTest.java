package com.dgt.backend.inventorymovements.service;

import com.dgt.backend.inventorymovements.dto.*;
import com.dgt.backend.inventorymovements.entity.InventoryMovement;
import com.dgt.backend.inventorymovements.repository.InventoryMovementRepository;
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
class InventoryMovementServiceTest {

    @Mock InventoryMovementRepository repository;
    @InjectMocks InventoryMovementService service;

    private InventoryMovement sampleEntity() {
        return InventoryMovement.builder()
            .movementId(1L)
            .dgtId("SAMPLE")
            .productId(1L)
            .movementType("SAMPLE")
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<InventoryMovementResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        InventoryMovementResponse result = service.get(1L);
        assertThat(result.movementId()).isEqualTo(1L);
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
        var req = new CreateInventoryMovementRequest("SAMPLE", 1L, "SAMPLE",
                new BigDecimal("1.000"), new BigDecimal("1.00"), 1L);
        when(repository.save(any(InventoryMovement.class))).thenReturn(sampleEntity());
        InventoryMovementResponse result = service.create(req);
        assertThat(result.movementId()).isEqualTo(1L);
        verify(repository).save(any(InventoryMovement.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateInventoryMovementRequest(null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
