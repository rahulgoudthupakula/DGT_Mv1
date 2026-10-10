package com.dgt.backend.productvendors.service;

import com.dgt.backend.productvendors.dto.*;
import com.dgt.backend.productvendors.entity.ProductVendor;
import com.dgt.backend.productvendors.repository.ProductVendorRepository;
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
class ProductVendorServiceTest {

    @Mock ProductVendorRepository repository;
    @InjectMocks ProductVendorService service;

    private ProductVendor sampleEntity() {
        return ProductVendor.builder()
            .productVendorId(1L)
            .productId(10L)
            .vendorId(20L)
            .vendorSku("SKU001")
            .unitCost(new BigDecimal("5.00"))
            .isPrimary(true)
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<ProductVendorResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        ProductVendorResponse result = service.get(1L);
        assertThat(result.productVendorId()).isEqualTo(1L);
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
        var req = new CreateProductVendorRequest(10L, 20L, "SKU001", "CASE", "EA", new BigDecimal("5.00"), true);
        when(repository.save(any(ProductVendor.class))).thenReturn(sampleEntity());
        ProductVendorResponse result = service.create(req);
        assertThat(result.productVendorId()).isEqualTo(1L);
        verify(repository).save(any(ProductVendor.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateProductVendorRequest(null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
