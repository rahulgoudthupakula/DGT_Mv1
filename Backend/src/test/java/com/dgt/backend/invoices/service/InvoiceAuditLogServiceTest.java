package com.dgt.backend.invoices.service;

import com.dgt.backend.invoices.dto.*;
import com.dgt.backend.invoices.entity.InvoiceAuditLog;
import com.dgt.backend.invoices.repository.InvoiceAuditLogRepository;
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
class InvoiceAuditLogServiceTest {

    @Mock InvoiceAuditLogRepository repository;
    @InjectMocks InvoiceAuditLogService service;

    private InvoiceAuditLog sampleEntity() {
        return InvoiceAuditLog.builder()
            .invoiceAuditLogId(1L)
            .invoiceId(1L)
            .actionType("SAMPLE")
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<InvoiceAuditLogResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        InvoiceAuditLogResponse result = service.get(1L);
        assertThat(result.invoiceAuditLogId()).isEqualTo(1L);
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
        var req = new CreateInvoiceAuditLogRequest(1L, "SAMPLE", 1L, "SAMPLE", "SAMPLE");
        when(repository.save(any(InvoiceAuditLog.class))).thenReturn(sampleEntity());
        InvoiceAuditLogResponse result = service.create(req);
        assertThat(result.invoiceAuditLogId()).isEqualTo(1L);
        verify(repository).save(any(InvoiceAuditLog.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateInvoiceAuditLogRequest(null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
