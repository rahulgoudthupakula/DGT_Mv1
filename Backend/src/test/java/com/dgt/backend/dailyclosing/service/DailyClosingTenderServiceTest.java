package com.dgt.backend.dailyclosing.service;

import com.dgt.backend.dailyclosing.dto.*;
import com.dgt.backend.dailyclosing.entity.DailyClosingTender;
import com.dgt.backend.dailyclosing.repository.DailyClosingTenderRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DailyClosingTenderServiceTest {

    @Mock DailyClosingTenderRepository repository;
    @InjectMocks DailyClosingTenderService service;

    private DailyClosingTender sampleEntity() {
        return DailyClosingTender.builder()
            .tenderId(1L)
            .everydayClosingId(10L)
            .tenderType("CASH")
            .expectedAmount(new BigDecimal("1000.00"))
            .actualAmount(new BigDecimal("980.00"))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        var pageData = new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1);
        when(repository.findAll(any(Pageable.class))).thenReturn(pageData);
        PageResponse<DailyClosingTenderResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        DailyClosingTenderResponse result = service.get(1L);
        assertThat(result.tenderId()).isEqualTo(1L);
        assertThat(result.tenderType()).isEqualTo("CASH");
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
        var req = new CreateDailyClosingTenderRequest(10L, "CASH", new BigDecimal("1000.00"), new BigDecimal("980.00"), null, null);
        when(repository.save(any(DailyClosingTender.class))).thenReturn(sampleEntity());
        DailyClosingTenderResponse result = service.create(req);
        assertThat(result.tenderId()).isEqualTo(1L);
        verify(repository).save(any(DailyClosingTender.class));
    }

    @Test
    void update_existingId_appliesChanges() {
        var req = new UpdateDailyClosingTenderRequest(null, null, null, new BigDecimal("990.00"), null, null);
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        DailyClosingTenderResponse result = service.update(1L, req);
        assertThat(result).isNotNull();
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        var req = new UpdateDailyClosingTenderRequest(null, null, null, null, null, null);
        assertThatThrownBy(() -> service.update(99L, req))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
