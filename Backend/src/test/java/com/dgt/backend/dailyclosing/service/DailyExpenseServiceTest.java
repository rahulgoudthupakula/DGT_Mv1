package com.dgt.backend.dailyclosing.service;

import com.dgt.backend.dailyclosing.dto.*;
import com.dgt.backend.dailyclosing.entity.DailyExpense;
import com.dgt.backend.dailyclosing.repository.DailyExpenseRepository;
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
class DailyExpenseServiceTest {

    @Mock DailyExpenseRepository repository;
    @InjectMocks DailyExpenseService service;

    private DailyExpense sampleEntity() {
        return DailyExpense.builder()
            .expensesId(1L)
            .everydayClosingId(10L)
            .expensesDate(LocalDate.of(2025, 1, 1))
            .expensesType("SUPPLIES")
            .amount(new BigDecimal("50.00"))
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
        DailyExpenseResponse result = service.get(1L);
        assertThat(result.expensesId()).isEqualTo(1L);
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
        var req = new CreateDailyExpenseRequest(10L, LocalDate.of(2025,1,1), "SUPPLIES", null, new BigDecimal("50.00"), null, null);
        when(repository.save(any(DailyExpense.class))).thenReturn(sampleEntity());
        DailyExpenseResponse result = service.create(req);
        assertThat(result.expensesId()).isEqualTo(1L);
        verify(repository).save(any(DailyExpense.class));
    }

    @Test
    void update_existingId_appliesChanges() {
        var req = new UpdateDailyExpenseRequest(null, null, null, "Updated desc", null, null, null);
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        assertThat(service.update(1L, req)).isNotNull();
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateDailyExpenseRequest(null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
