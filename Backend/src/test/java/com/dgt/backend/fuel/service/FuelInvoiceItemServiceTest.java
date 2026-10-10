package com.dgt.backend.fuel.service;

import com.dgt.backend.fuel.dto.*;
import com.dgt.backend.fuel.entity.FuelInvoiceItem;
import com.dgt.backend.fuel.repository.FuelInvoiceItemRepository;
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
class FuelInvoiceItemServiceTest {

    @Mock FuelInvoiceItemRepository repository;
    @InjectMocks FuelInvoiceItemService service;

    private FuelInvoiceItem sampleEntity() {
        return FuelInvoiceItem.builder()
            .fuelInvoiceItemId(1L)
            .invoiceId(1L)
            .fuelGradeId(1L)
            .grossGallons(new BigDecimal("1000.000"))
            .netGallons(new BigDecimal("990.000"))
            .pricePerGallon(new BigDecimal("2.5000"))
            .fuelLineTotal(new BigDecimal("2475.00"))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<FuelInvoiceItemResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        FuelInvoiceItemResponse result = service.get(1L);
        assertThat(result.fuelInvoiceItemId()).isEqualTo(1L);
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
        var req = new CreateFuelInvoiceItemRequest(1L, 1L,
                new BigDecimal("1000.000"), new BigDecimal("990.000"),
                new BigDecimal("2.5000"), new BigDecimal("2475.00"));
        when(repository.save(any(FuelInvoiceItem.class))).thenReturn(sampleEntity());
        FuelInvoiceItemResponse result = service.create(req);
        assertThat(result.fuelInvoiceItemId()).isEqualTo(1L);
        verify(repository).save(any(FuelInvoiceItem.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateFuelInvoiceItemRequest(null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
