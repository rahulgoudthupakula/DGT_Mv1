package com.dgt.backend.employees.service;

import com.dgt.backend.employees.dto.*;
import com.dgt.backend.employees.entity.EmployeeDocument;
import com.dgt.backend.employees.repository.EmployeeDocumentRepository;
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
class EmployeeDocumentServiceTest {

    @Mock EmployeeDocumentRepository repository;
    @InjectMocks EmployeeDocumentService service;

    private EmployeeDocument sampleEntity() {
        return EmployeeDocument.builder()
            .employeeDocumentId(1L)
            .employeeId(10L)
            .documentType("ID")
            .documentName("passport.pdf")
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<EmployeeDocumentResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        EmployeeDocumentResponse result = service.get(1L);
        assertThat(result.employeeDocumentId()).isEqualTo(1L);
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
        var req = new CreateEmployeeDocumentRequest(10L, "ID", "passport.pdf", null, null);
        when(repository.save(any(EmployeeDocument.class))).thenReturn(sampleEntity());
        EmployeeDocumentResponse result = service.create(req);
        assertThat(result.employeeDocumentId()).isEqualTo(1L);
        verify(repository).save(any(EmployeeDocument.class));
    }

    @Test
    void update_existingId_appliesChanges() {
        var req = new UpdateEmployeeDocumentRequest(null, "PASSPORT", null, null, null);
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        EmployeeDocumentResponse result = service.update(1L, req);
        assertThat(result).isNotNull();
        verify(repository).save(entity);
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateEmployeeDocumentRequest(null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
