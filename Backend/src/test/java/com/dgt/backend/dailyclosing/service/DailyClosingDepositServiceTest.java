package com.dgt.backend.dailyclosing.service;

import com.dgt.backend.dailyclosing.dto.*;
import com.dgt.backend.dailyclosing.entity.DailyClosingDeposit;
import com.dgt.backend.dailyclosing.repository.DailyClosingDepositRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DailyClosingDepositServiceTest {

    @Mock DailyClosingDepositRepository repository;
    @InjectMocks DailyClosingDepositService service;

    private DailyClosingDeposit sampleEntity() {
        return DailyClosingDeposit.builder()
            .depositId(1L)
            .everydayClosingId(10L)
            .depositDate(LocalDate.of(2025, 1, 1))
            .amount(new BigDecimal("500.00"))
            .status("PENDING")
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        var pageData = new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1);
        when(repository.findAll(any(Pageable.class))).thenReturn(pageData);
        PageResponse<DailyClosingDepositResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        DailyClosingDepositResponse result = service.get(1L);
        assertThat(result.depositId()).isEqualTo(1L);
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
        var req = new CreateDailyClosingDepositRequest(10L, LocalDate.of(2025,1,1), null, new BigDecimal("500.00"), null, null, "PENDING");
        when(repository.save(any(DailyClosingDeposit.class))).thenReturn(sampleEntity());
        DailyClosingDepositResponse result = service.create(req);
        assertThat(result.depositId()).isEqualTo(1L);
        verify(repository).save(any(DailyClosingDeposit.class));
    }

    @Test
    void update_existingId_appliesChanges() {
        var req = new UpdateDailyClosingDepositRequest(null, null, null, new BigDecimal("600.00"), null, null, "COMPLETED");
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        DailyClosingDepositResponse result = service.update(1L, req);
        assertThat(result).isNotNull();
        verify(repository).save(entity);
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        var req = new UpdateDailyClosingDepositRequest(null, null, null, null, null, null, null);
        assertThatThrownBy(() -> service.update(99L, req))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
