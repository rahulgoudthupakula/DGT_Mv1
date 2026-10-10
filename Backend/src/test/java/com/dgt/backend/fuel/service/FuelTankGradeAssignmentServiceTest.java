package com.dgt.backend.fuel.service;

import com.dgt.backend.fuel.dto.*;
import com.dgt.backend.fuel.entity.FuelTankGradeAssignment;
import com.dgt.backend.fuel.repository.FuelTankGradeAssignmentRepository;
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
class FuelTankGradeAssignmentServiceTest {

    @Mock FuelTankGradeAssignmentRepository repository;
    @InjectMocks FuelTankGradeAssignmentService service;

    private FuelTankGradeAssignment sampleEntity() {
        return FuelTankGradeAssignment.builder()
            .assignmentId(1L)
            .tankId(1L)
            .fuelGradeId(1L)
            .effectiveFrom(LocalDate.of(2025, 1, 1))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<FuelTankGradeAssignmentResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        FuelTankGradeAssignmentResponse result = service.get(1L);
        assertThat(result.assignmentId()).isEqualTo(1L);
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
        var req = new CreateFuelTankGradeAssignmentRequest(1L, 1L, LocalDate.of(2025, 1, 1), null);
        when(repository.save(any(FuelTankGradeAssignment.class))).thenReturn(sampleEntity());
        FuelTankGradeAssignmentResponse result = service.create(req);
        assertThat(result.assignmentId()).isEqualTo(1L);
        verify(repository).save(any(FuelTankGradeAssignment.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateFuelTankGradeAssignmentRequest(null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
