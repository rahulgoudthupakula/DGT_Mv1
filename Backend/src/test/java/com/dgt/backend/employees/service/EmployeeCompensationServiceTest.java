package com.dgt.backend.employees.service;

import com.dgt.backend.employees.dto.*;
import com.dgt.backend.employees.entity.EmployeeCompensation;
import com.dgt.backend.employees.repository.EmployeeCompensationRepository;
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
class EmployeeCompensationServiceTest {

    @Mock EmployeeCompensationRepository repository;
    @InjectMocks EmployeeCompensationService service;

    private EmployeeCompensation sampleEntity() {
        return EmployeeCompensation.builder()
            .compensationId(1L)
            .employeeId(10L)
            .payType("HOURLY")
            .hourlyRate(new BigDecimal("15.00"))
            .effectiveFrom(LocalDate.of(2025, 1, 1))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        var entity = sampleEntity();
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(entity), PageRequest.of(0, 50), 1));
        PageResponse<EmployeeCompensationResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        EmployeeCompensationResponse result = service.get(1L);
        assertThat(result.compensationId()).isEqualTo(1L);
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
        var req = new CreateEmployeeCompensationRequest(10L, "HOURLY", new BigDecimal("15.00"), null, LocalDate.of(2025, 1, 1), null);
        when(repository.save(any(EmployeeCompensation.class))).thenReturn(sampleEntity());
        EmployeeCompensationResponse result = service.create(req);
        assertThat(result.compensationId()).isEqualTo(1L);
        verify(repository).save(any(EmployeeCompensation.class));
    }

    @Test
    void update_existingId_appliesChanges() {
        var req = new UpdateEmployeeCompensationRequest(null, "SALARY", null, new BigDecimal("50000.00"), null, null);
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        EmployeeCompensationResponse result = service.update(1L, req);
        assertThat(result).isNotNull();
        verify(repository).save(entity);
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        var req = new UpdateEmployeeCompensationRequest(null, null, null, null, null, null);
        assertThatThrownBy(() -> service.update(99L, req))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
