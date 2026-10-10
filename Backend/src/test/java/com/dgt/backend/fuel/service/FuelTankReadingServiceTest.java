package com.dgt.backend.fuel.service;

import com.dgt.backend.fuel.dto.*;
import com.dgt.backend.fuel.entity.FuelTankReading;
import com.dgt.backend.fuel.repository.FuelTankReadingRepository;
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
class FuelTankReadingServiceTest {

    @Mock FuelTankReadingRepository repository;
    @InjectMocks FuelTankReadingService service;

    private FuelTankReading sampleEntity() {
        return FuelTankReading.builder()
            .tankReadingId(1L)
            .tankId(1L)
            .readingDatetime(OffsetDateTime.now())
            .volumeGallons(new BigDecimal("8000.000"))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<FuelTankReadingResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        FuelTankReadingResponse result = service.get(1L);
        assertThat(result.tankReadingId()).isEqualTo(1L);
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
        var req = new CreateFuelTankReadingRequest(1L, OffsetDateTime.now(),
                new BigDecimal("8000.000"), null, null, 1L, null);
        when(repository.save(any(FuelTankReading.class))).thenReturn(sampleEntity());
        FuelTankReadingResponse result = service.create(req);
        assertThat(result.tankReadingId()).isEqualTo(1L);
        verify(repository).save(any(FuelTankReading.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateFuelTankReadingRequest(null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
