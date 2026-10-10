package com.dgt.backend.sales.service;

import com.dgt.backend.sales.dto.*;
import com.dgt.backend.sales.entity.SalePayment;
import com.dgt.backend.sales.repository.SalePaymentRepository;
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
class SalePaymentServiceTest {

    @Mock SalePaymentRepository repository;
    @InjectMocks SalePaymentService service;

    private SalePayment sampleEntity() {
        return SalePayment.builder()
            .salePaymentId(1L)
            .saleId(1L)
            .paymentAmount(new BigDecimal("1.00"))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<SalePaymentResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        SalePaymentResponse result = service.get(1L);
        assertThat(result.salePaymentId()).isEqualTo(1L);
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
        var req = new CreateSalePaymentRequest(1L, null, new BigDecimal("1.00"), null, null, null, null, null, null);
        when(repository.save(any(SalePayment.class))).thenReturn(sampleEntity());
        SalePaymentResponse result = service.create(req);
        assertThat(result.salePaymentId()).isEqualTo(1L);
        verify(repository).save(any(SalePayment.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateSalePaymentRequest(null, null, null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
