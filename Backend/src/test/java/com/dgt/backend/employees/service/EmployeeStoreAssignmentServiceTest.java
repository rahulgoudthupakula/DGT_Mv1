package com.dgt.backend.employees.service;

import com.dgt.backend.employees.dto.*;
import com.dgt.backend.employees.entity.EmployeeStoreAssignment;
import com.dgt.backend.employees.repository.EmployeeStoreAssignmentRepository;
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
class EmployeeStoreAssignmentServiceTest {

    @Mock EmployeeStoreAssignmentRepository repository;
    @InjectMocks EmployeeStoreAssignmentService service;

    private EmployeeStoreAssignment sampleEntity() {
        return EmployeeStoreAssignment.builder()
            .employeeStoreAssignmentId(1L)
            .employeeId(10L)
            .dgtId("DGT-001")
            .effectiveFrom(LocalDate.of(2025, 1, 1))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<EmployeeStoreAssignmentResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        EmployeeStoreAssignmentResponse result = service.get(1L);
        assertThat(result.employeeStoreAssignmentId()).isEqualTo(1L);
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
        var req = new CreateEmployeeStoreAssignmentRequest(10L, "DGT-001", true, LocalDate.of(2025, 1, 1), null, null);
        when(repository.save(any(EmployeeStoreAssignment.class))).thenReturn(sampleEntity());
        EmployeeStoreAssignmentResponse result = service.create(req);
        assertThat(result.employeeStoreAssignmentId()).isEqualTo(1L);
        verify(repository).save(any(EmployeeStoreAssignment.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateEmployeeStoreAssignmentRequest(null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
