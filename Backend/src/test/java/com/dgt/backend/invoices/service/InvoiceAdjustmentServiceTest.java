package com.dgt.backend.invoices.service;

import com.dgt.backend.invoices.dto.*;
import com.dgt.backend.invoices.entity.InvoiceAdjustment;
import com.dgt.backend.invoices.repository.InvoiceAdjustmentRepository;
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
class InvoiceAdjustmentServiceTest {

    @Mock InvoiceAdjustmentRepository repository;
    @InjectMocks InvoiceAdjustmentService service;

    private InvoiceAdjustment sampleEntity() {
        return InvoiceAdjustment.builder()
            .invoiceAdjustmentId(1L)
            .invoiceId(1L)
            .adjustmentType("SAMPLE")
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<InvoiceAdjustmentResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        InvoiceAdjustmentResponse result = service.get(1L);
        assertThat(result.invoiceAdjustmentId()).isEqualTo(1L);
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
        var req = new CreateInvoiceAdjustmentRequest(1L, "SAMPLE", new BigDecimal("1.00"), "SAMPLE");
        when(repository.save(any(InvoiceAdjustment.class))).thenReturn(sampleEntity());
        InvoiceAdjustmentResponse result = service.create(req);
        assertThat(result.invoiceAdjustmentId()).isEqualTo(1L);
        verify(repository).save(any(InvoiceAdjustment.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateInvoiceAdjustmentRequest(null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
