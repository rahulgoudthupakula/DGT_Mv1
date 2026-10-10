package com.dgt.backend.invoices.service;

import com.dgt.backend.invoices.dto.*;
import com.dgt.backend.invoices.entity.InvoiceCharge;
import com.dgt.backend.invoices.repository.InvoiceChargeRepository;
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
class InvoiceChargeServiceTest {

    @Mock InvoiceChargeRepository repository;
    @InjectMocks InvoiceChargeService service;

    private InvoiceCharge sampleEntity() {
        return InvoiceCharge.builder()
            .invoiceChargeId(1L)
            .invoiceId(1L)
            .chargeType("SAMPLE")
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<InvoiceChargeResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        InvoiceChargeResponse result = service.get(1L);
        assertThat(result.invoiceChargeId()).isEqualTo(1L);
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
        var req = new CreateInvoiceChargeRequest(1L, "SAMPLE", null, null, null, null, null, null);
        when(repository.save(any(InvoiceCharge.class))).thenReturn(sampleEntity());
        InvoiceChargeResponse result = service.create(req);
        assertThat(result.invoiceChargeId()).isEqualTo(1L);
        verify(repository).save(any(InvoiceCharge.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateInvoiceChargeRequest(null, null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
