package com.dgt.backend.employees.service;

import com.dgt.backend.employees.dto.*;
import com.dgt.backend.employees.entity.EmployeeSchedule;
import com.dgt.backend.employees.repository.EmployeeScheduleRepository;
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
class EmployeeScheduleServiceTest {

    @Mock EmployeeScheduleRepository repository;
    @InjectMocks EmployeeScheduleService service;

    private EmployeeSchedule sampleEntity() {
        return EmployeeSchedule.builder()
            .scheduleId(1L)
            .employeeId(10L)
            .dgtId("DGT-001")
            .workDate(LocalDate.of(2025, 1, 1))
            .status("SCHEDULED")
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<EmployeeScheduleResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        EmployeeScheduleResponse result = service.get(1L);
        assertThat(result.scheduleId()).isEqualTo(1L);
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
        var req = new CreateEmployeeScheduleRequest(10L, "DGT-001", LocalDate.of(2025, 1, 1), null, null, "SCHEDULED", null, null);
        when(repository.save(any(EmployeeSchedule.class))).thenReturn(sampleEntity());
        EmployeeScheduleResponse result = service.create(req);
        assertThat(result.scheduleId()).isEqualTo(1L);
        verify(repository).save(any(EmployeeSchedule.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateEmployeeScheduleRequest(null, null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
