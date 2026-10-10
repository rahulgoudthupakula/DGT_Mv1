package com.dgt.backend.sales.service;

import com.dgt.backend.sales.dto.*;
import com.dgt.backend.sales.entity.PosTerminal;
import com.dgt.backend.sales.repository.PosTerminalRepository;
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
class PosTerminalServiceTest {

    @Mock PosTerminalRepository repository;
    @InjectMocks PosTerminalService service;

    private PosTerminal sampleEntity() {
        return PosTerminal.builder()
            .terminalId(1L)
            .storeId("SAMPLE")
            .terminalCode("SAMPLE")
            .terminalName("SAMPLE")
            .terminalStatus("SAMPLE")
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<PosTerminalResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        PosTerminalResponse result = service.get(1L);
        assertThat(result.terminalId()).isEqualTo(1L);
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
        var req = new CreatePosTerminalRequest("SAMPLE", "SAMPLE", "SAMPLE", "SAMPLE");
        when(repository.save(any(PosTerminal.class))).thenReturn(sampleEntity());
        PosTerminalResponse result = service.create(req);
        assertThat(result.terminalId()).isEqualTo(1L);
        verify(repository).save(any(PosTerminal.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdatePosTerminalRequest(null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
