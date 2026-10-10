package com.dgt.backend.departments.service;

import com.dgt.backend.departments.dto.*;
import com.dgt.backend.departments.entity.StoreSubDepartment;
import com.dgt.backend.departments.repository.StoreSubDepartmentRepository;
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
class StoreSubDepartmentServiceTest {

    @Mock StoreSubDepartmentRepository repository;
    @InjectMocks StoreSubDepartmentService service;

    private StoreSubDepartment sampleEntity() {
        return StoreSubDepartment.builder()
            .storeSubDepartmentId(1L)
            .storeDepartmentId(10L)
            .storeSubDepartmentName("Soda")
            .isTaxable(true)
            .isActive(true)
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        var pageData = new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1);
        when(repository.findAll(any(Pageable.class))).thenReturn(pageData);
        assertThat(service.list(0, 50).items()).hasSize(1);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        StoreSubDepartmentResponse result = service.get(1L);
        assertThat(result.storeSubDepartmentId()).isEqualTo(1L);
        assertThat(result.storeSubDepartmentName()).isEqualTo("Soda");
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
        var req = new CreateStoreSubDepartmentRequest(10L, "Soda", true, true, "MANUAL");
        when(repository.save(any(StoreSubDepartment.class))).thenReturn(sampleEntity());
        StoreSubDepartmentResponse result = service.create(req);
        assertThat(result.storeSubDepartmentId()).isEqualTo(1L);
        verify(repository).save(any(StoreSubDepartment.class));
    }

    @Test
    void update_existingId_appliesChanges() {
        var req = new UpdateStoreSubDepartmentRequest(null, "Water", null, null, null);
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        assertThat(service.update(1L, req)).isNotNull();
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateStoreSubDepartmentRequest(null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
