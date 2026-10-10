package com.dgt.backend.dailyclosing.service;

import com.dgt.backend.dailyclosing.dto.*;
import com.dgt.backend.dailyclosing.entity.EverydayClosing;
import com.dgt.backend.dailyclosing.repository.EverydayClosingRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EverydayClosingServiceTest {

    @Mock EverydayClosingRepository repository;
    @InjectMocks EverydayClosingService service;

    private EverydayClosing sampleEntity() {
        return EverydayClosing.builder()
            .everydayClosingId(1L)
            .dgtId("DGT-S1")
            .openingDatetime(OffsetDateTime.now())
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        var pageData = new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1);
        when(repository.findAll(any(Pageable.class))).thenReturn(pageData);
        PageResponse<EverydayClosingResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        EverydayClosingResponse result = service.get(1L);
        assertThat(result.everydayClosingId()).isEqualTo(1L);
        assertThat(result.dgtId()).isEqualTo("DGT-S1");
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
        var now = OffsetDateTime.now();
        var req = new CreateEverydayClosingRequest("DGT-S1", now, null,
            null, null, null, null, null, null, null, null, null, null);
        when(repository.save(any(EverydayClosing.class))).thenReturn(sampleEntity());
        EverydayClosingResponse result = service.create(req);
        assertThat(result.dgtId()).isEqualTo("DGT-S1");
        verify(repository).save(any(EverydayClosing.class));
    }

    @Test
    void update_existingId_appliesChanges() {
        var req = new UpdateEverydayClosingRequest(null, null, OffsetDateTime.now(),
            null, null, null, null, null, null, null, null, null, null);
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        EverydayClosingResponse result = service.update(1L, req);
        assertThat(result).isNotNull();
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        var req = new UpdateEverydayClosingRequest(null, null, null, null, null, null, null, null, null, null, null, null, null);
        assertThatThrownBy(() -> service.update(99L, req))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
