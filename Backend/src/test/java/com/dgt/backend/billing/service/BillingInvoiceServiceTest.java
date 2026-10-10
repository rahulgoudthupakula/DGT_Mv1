package com.dgt.backend.billing.service;

import com.dgt.backend.billing.dto.*;
import com.dgt.backend.billing.entity.BillingInvoice;
import com.dgt.backend.billing.repository.BillingInvoiceRepository;
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
class BillingInvoiceServiceTest {

    @Mock BillingInvoiceRepository repository;
    @InjectMocks BillingInvoiceService service;

    private BillingInvoice sampleEntity() {
        return BillingInvoice.builder()
            .invoiceId(1L)
            .storeId("DGT-S1")
            .subscriptionPlanId(2L)
            .invoiceNumber("INV-001")
            .invoiceDate(LocalDate.of(2025, 1, 1))
            .periodStart(LocalDate.of(2025, 1, 1))
            .periodEnd(LocalDate.of(2025, 1, 31))
            .subtotal(new BigDecimal("100.00"))
            .taxAmount(new BigDecimal("10.00"))
            .totalAmount(new BigDecimal("110.00"))
            .dgtInvoiceStatus("PENDING")
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        var pageData = new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1);
        when(repository.findAll(any(Pageable.class))).thenReturn(pageData);

        PageResponse<BillingInvoiceResponse> result = service.list(0, 50);

        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void list_empty_returnsEmptyPage() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));
        assertThat(service.list(0, 50).items()).isEmpty();
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        BillingInvoiceResponse result = service.get(1L);
        assertThat(result.invoiceId()).isEqualTo(1L);
        assertThat(result.storeId()).isEqualTo("DGT-S1");
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
    void create_validRequest_savesAndReturns() {
        var req = new CreateBillingInvoiceRequest(
            "DGT-S1", 2L, "INV-001",
            LocalDate.of(2025,1,1), LocalDate.of(2025,1,1), LocalDate.of(2025,1,31),
            new BigDecimal("100.00"), new BigDecimal("10.00"), new BigDecimal("110.00"),
            "PENDING", null, null);
        when(repository.save(any(BillingInvoice.class))).thenReturn(sampleEntity());

        BillingInvoiceResponse result = service.create(req);

        assertThat(result.invoiceId()).isEqualTo(1L);
        verify(repository).save(any(BillingInvoice.class));
    }

    @Test
    void update_existingId_appliesChangesAndReturns() {
        var req = new UpdateBillingInvoiceRequest(null, null, null, null, null, null, null, null, null, "PAID", null, null);
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);

        BillingInvoiceResponse result = service.update(1L, req);
        assertThat(result).isNotNull();
        verify(repository).save(entity);
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        var req = new UpdateBillingInvoiceRequest(null, null, null, null, null, null, null, null, null, null, null, null);
        assertThatThrownBy(() -> service.update(99L, req))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
