package com.dgt.backend.employees.service;

import com.dgt.backend.employees.dto.*;
import com.dgt.backend.employees.entity.EmployeeTimeOffRequest;
import com.dgt.backend.employees.repository.EmployeeTimeOffRequestRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeTimeOffRequestServiceTest {

    @Mock EmployeeTimeOffRequestRepository repository;
    @InjectMocks EmployeeTimeOffRequestService service;

    private EmployeeTimeOffRequest sampleEntity() {
        return EmployeeTimeOffRequest.builder()
            .timeOffRequestId(1L)
            .employeeId(10L)
            .startDate(LocalDate.of(2025, 1, 1))
            .endDate(LocalDate.of(2025, 1, 5))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<EmployeeTimeOffRequestResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        EmployeeTimeOffRequestResponse result = service.get(1L);
        assertThat(result.timeOffRequestId()).isEqualTo(1L);
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
        var req = new CreateEmployeeTimeOffRequestRequest(10L, null, LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 5), null, null, null, null, null, null, null);
        when(repository.save(any(EmployeeTimeOffRequest.class))).thenReturn(sampleEntity());
        EmployeeTimeOffRequestResponse result = service.create(req);
        assertThat(result.timeOffRequestId()).isEqualTo(1L);
        verify(repository).save(any(EmployeeTimeOffRequest.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateEmployeeTimeOffRequestRequest(null, null, null, null, null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
