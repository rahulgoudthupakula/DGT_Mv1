package com.dgt.backend.departments.service;

import com.dgt.backend.departments.dto.*;
import com.dgt.backend.departments.entity.StoreDepartment;
import com.dgt.backend.departments.repository.StoreDepartmentRepository;
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
class StoreDepartmentServiceTest {

    @Mock StoreDepartmentRepository repository;
    @InjectMocks StoreDepartmentService service;

    private StoreDepartment sampleEntity() {
        return StoreDepartment.builder()
            .storeDepartmentId(1L)
            .dgtId("DGT-S1")
            .departmentId(5L)
            .storeDepartmentName("My Beverages")
            .isActive(true)
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        var pageData = new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1);
        when(repository.findAll(any(Pageable.class))).thenReturn(pageData);
        PageResponse<StoreDepartmentResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        StoreDepartmentResponse result = service.get(1L);
        assertThat(result.storeDepartmentId()).isEqualTo(1L);
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
    void create_savesAndReturns() {
        var req = new CreateStoreDepartmentRequest("DGT-S1", 5L, "My Beverages", true, "MANUAL");
        when(repository.save(any(StoreDepartment.class))).thenReturn(sampleEntity());
        StoreDepartmentResponse result = service.create(req);
        assertThat(result.storeDepartmentId()).isEqualTo(1L);
        verify(repository).save(any(StoreDepartment.class));
    }

    @Test
    void update_existingId_appliesChanges() {
        var req = new UpdateStoreDepartmentRequest(null, null, "New Name", null, null);
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        assertThat(service.update(1L, req)).isNotNull();
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateStoreDepartmentRequest(null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
