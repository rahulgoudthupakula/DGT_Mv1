package com.dgt.backend.fuel.service;

import com.dgt.backend.fuel.dto.*;
import com.dgt.backend.fuel.entity.FuelPump;
import com.dgt.backend.fuel.repository.FuelPumpRepository;
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
class FuelPumpServiceTest {

    @Mock FuelPumpRepository repository;
    @InjectMocks FuelPumpService service;

    private FuelPump sampleEntity() {
        return FuelPump.builder()
            .pumpId(1L)
            .dgtId("STORE-001")
            .pumpNumber("P1")
            .status("ACTIVE")
            .serialNumber("SN-123")
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<FuelPumpResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        FuelPumpResponse result = service.get(1L);
        assertThat(result.pumpId()).isEqualTo(1L);
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
        var req = new CreateFuelPumpRequest("STORE-001", "P1", "ACTIVE", "SN-123");
        when(repository.save(any(FuelPump.class))).thenReturn(sampleEntity());
        FuelPumpResponse result = service.create(req);
        assertThat(result.pumpId()).isEqualTo(1L);
        verify(repository).save(any(FuelPump.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateFuelPumpRequest(null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
