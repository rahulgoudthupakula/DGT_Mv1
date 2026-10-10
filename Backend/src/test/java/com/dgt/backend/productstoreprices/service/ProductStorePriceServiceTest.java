package com.dgt.backend.productstoreprices.service;

import com.dgt.backend.productstoreprices.dto.*;
import com.dgt.backend.productstoreprices.entity.ProductStorePrice;
import com.dgt.backend.productstoreprices.repository.ProductStorePriceRepository;
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
class ProductStorePriceServiceTest {

    @Mock ProductStorePriceRepository repository;
    @InjectMocks ProductStorePriceService service;

    private ProductStorePrice sampleEntity() {
        return ProductStorePrice.builder()
            .storePriceId(1L)
            .dgtId("STORE1")
            .productId(10L)
            .retailPrice(new BigDecimal("2.99"))
            .isActive(true)
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<ProductStorePriceResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        ProductStorePriceResponse result = service.get(1L);
        assertThat(result.storePriceId()).isEqualTo(1L);
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
        var req = new CreateProductStorePriceRequest("STORE1", 10L, new BigDecimal("2.99"), true, null);
        when(repository.save(any(ProductStorePrice.class))).thenReturn(sampleEntity());
        ProductStorePriceResponse result = service.create(req);
        assertThat(result.storePriceId()).isEqualTo(1L);
        verify(repository).save(any(ProductStorePrice.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateProductStorePriceRequest(null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
