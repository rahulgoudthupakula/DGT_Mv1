package com.dgt.backend.fuel.service;

import com.dgt.backend.fuel.dto.*;
import com.dgt.backend.fuel.entity.FuelInvoiceDetail;
import com.dgt.backend.fuel.repository.FuelInvoiceDetailRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FuelInvoiceDetailServiceTest {

    @Mock FuelInvoiceDetailRepository repository;
    @InjectMocks FuelInvoiceDetailService service;

    private FuelInvoiceDetail sampleEntity() {
        return FuelInvoiceDetail.builder()
            .fuelInvoiceDetailsId(1L)
            .invoiceId(1L)
            .deliveryNumber("DN-001")
            .billOfLadingNumber("BOL-001")
            .carrierName("Carrier Co")
            .deliveryDate(LocalDate.of(2025, 1, 1))
            .totalGallons(new BigDecimal("1000.000"))
            .fuelSubtotal(new BigDecimal("2500.00"))
            .freightAmount(new BigDecimal("50.00"))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<FuelInvoiceDetailResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        FuelInvoiceDetailResponse result = service.get(1L);
        assertThat(result.fuelInvoiceDetailsId()).isEqualTo(1L);
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
        var req = new CreateFuelInvoiceDetailRequest(1L, "DN-001", "BOL-001", "Carrier Co",
                LocalDate.of(2025, 1, 1), new BigDecimal("1000.000"),
                new BigDecimal("2500.00"), new BigDecimal("50.00"));
        when(repository.save(any(FuelInvoiceDetail.class))).thenReturn(sampleEntity());
        FuelInvoiceDetailResponse result = service.create(req);
        assertThat(result.fuelInvoiceDetailsId()).isEqualTo(1L);
        verify(repository).save(any(FuelInvoiceDetail.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateFuelInvoiceDetailRequest(null, null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
