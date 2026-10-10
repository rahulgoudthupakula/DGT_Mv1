package com.dgt.backend.employees.service;

import com.dgt.backend.employees.dto.*;
import com.dgt.backend.employees.entity.EmployeeStatusHistory;
import com.dgt.backend.employees.repository.EmployeeStatusHistoryRepository;
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
class EmployeeStatusHistoryServiceTest {

    @Mock EmployeeStatusHistoryRepository repository;
    @InjectMocks EmployeeStatusHistoryService service;

    private EmployeeStatusHistory sampleEntity() {
        return EmployeeStatusHistory.builder()
            .statusHistoryId(1L)
            .employeeId(10L)
            .status("ACTIVE")
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<EmployeeStatusHistoryResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        EmployeeStatusHistoryResponse result = service.get(1L);
        assertThat(result.statusHistoryId()).isEqualTo(1L);
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
        var req = new CreateEmployeeStatusHistoryRequest(10L, "ACTIVE", null);
        when(repository.save(any(EmployeeStatusHistory.class))).thenReturn(sampleEntity());
        EmployeeStatusHistoryResponse result = service.create(req);
        assertThat(result.statusHistoryId()).isEqualTo(1L);
        verify(repository).save(any(EmployeeStatusHistory.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateEmployeeStatusHistoryRequest(null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
