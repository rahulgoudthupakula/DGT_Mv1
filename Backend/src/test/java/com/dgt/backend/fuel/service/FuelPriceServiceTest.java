package com.dgt.backend.fuel.service;

import com.dgt.backend.fuel.dto.*;
import com.dgt.backend.fuel.entity.FuelPrice;
import com.dgt.backend.fuel.repository.FuelPriceRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FuelPriceServiceTest {

    @Mock FuelPriceRepository repository;
    @InjectMocks FuelPriceService service;

    private FuelPrice sampleEntity() {
        return FuelPrice.builder()
            .fuelPriceId(1L)
            .dgtId("STORE-001")
            .fuelGradeId(1L)
            .cashPrice(new BigDecimal("3.499"))
            .creditPrice(new BigDecimal("3.699"))
            .effectiveFrom(OffsetDateTime.now())
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<FuelPriceResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        FuelPriceResponse result = service.get(1L);
        assertThat(result.fuelPriceId()).isEqualTo(1L);
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
        var req = new CreateFuelPriceRequest("STORE-001", 1L,
                new BigDecimal("3.499"), new BigDecimal("3.699"),
                OffsetDateTime.now(), null, 1L);
        when(repository.save(any(FuelPrice.class))).thenReturn(sampleEntity());
        FuelPriceResponse result = service.create(req);
        assertThat(result.fuelPriceId()).isEqualTo(1L);
        verify(repository).save(any(FuelPrice.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateFuelPriceRequest(null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
