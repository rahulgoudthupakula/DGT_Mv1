package com.dgt.backend.fuel.service;

import com.dgt.backend.fuel.dto.*;
import com.dgt.backend.fuel.entity.FuelTank;
import com.dgt.backend.fuel.repository.FuelTankRepository;
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
class FuelTankServiceTest {

    @Mock FuelTankRepository repository;
    @InjectMocks FuelTankService service;

    private FuelTank sampleEntity() {
        return FuelTank.builder()
            .tankId(1L)
            .dgtId("STORE-001")
            .tankNumber("T1")
            .tankName("Tank One")
            .capacityGallons(new BigDecimal("10000.000"))
            .safeFillCapacity(new BigDecimal("9500.000"))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<FuelTankResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        FuelTankResponse result = service.get(1L);
        assertThat(result.tankId()).isEqualTo(1L);
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
        var req = new CreateFuelTankRequest("STORE-001", "T1", "Tank One",
                new BigDecimal("10000.000"), new BigDecimal("9500.000"));
        when(repository.save(any(FuelTank.class))).thenReturn(sampleEntity());
        FuelTankResponse result = service.create(req);
        assertThat(result.tankId()).isEqualTo(1L);
        verify(repository).save(any(FuelTank.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateFuelTankRequest(null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
