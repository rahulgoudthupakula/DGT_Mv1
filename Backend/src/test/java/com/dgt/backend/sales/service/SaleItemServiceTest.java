package com.dgt.backend.sales.service;

import com.dgt.backend.sales.dto.*;
import com.dgt.backend.sales.entity.SaleItem;
import com.dgt.backend.sales.repository.SaleItemRepository;
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
class SaleItemServiceTest {

    @Mock SaleItemRepository repository;
    @InjectMocks SaleItemService service;

    private SaleItem sampleEntity() {
        return SaleItem.builder()
            .salesItemId(1L)
            .saleId(1L)
            .quantity(new BigDecimal("1.000"))
            .unitPrice(new BigDecimal("1.00"))
            .lineTotal(new BigDecimal("1.00"))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<SaleItemResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        SaleItemResponse result = service.get(1L);
        assertThat(result.salesItemId()).isEqualTo(1L);
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
        var req = new CreateSaleItemRequest(1L, null, new BigDecimal("1.000"), null,
                new BigDecimal("1.00"), null, null, null, null, new BigDecimal("1.00"));
        when(repository.save(any(SaleItem.class))).thenReturn(sampleEntity());
        SaleItemResponse result = service.create(req);
        assertThat(result.salesItemId()).isEqualTo(1L);
        verify(repository).save(any(SaleItem.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateSaleItemRequest(null, null, null, null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
