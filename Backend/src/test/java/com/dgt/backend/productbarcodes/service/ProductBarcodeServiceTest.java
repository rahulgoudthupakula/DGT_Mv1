package com.dgt.backend.productbarcodes.service;

import com.dgt.backend.productbarcodes.dto.*;
import com.dgt.backend.productbarcodes.entity.ProductBarcode;
import com.dgt.backend.productbarcodes.repository.ProductBarcodeRepository;
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
class ProductBarcodeServiceTest {

    @Mock ProductBarcodeRepository repository;
    @InjectMocks ProductBarcodeService service;

    private ProductBarcode sampleEntity() {
        return ProductBarcode.builder()
            .productBarcodeId(1L)
            .productId(10L)
            .productBarcodeType("UPC")
            .productBarcodeValue("012345678901")
            .isPrimary(true)
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<ProductBarcodeResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        ProductBarcodeResponse result = service.get(1L);
        assertThat(result.productBarcodeId()).isEqualTo(1L);
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
        var req = new CreateProductBarcodeRequest(10L, "UPC", "012345678901", true);
        when(repository.save(any(ProductBarcode.class))).thenReturn(sampleEntity());
        ProductBarcodeResponse result = service.create(req);
        assertThat(result.productBarcodeId()).isEqualTo(1L);
        verify(repository).save(any(ProductBarcode.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateProductBarcodeRequest(null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
