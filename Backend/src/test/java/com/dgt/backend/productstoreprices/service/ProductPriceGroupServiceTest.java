package com.dgt.backend.productstoreprices.service;

import com.dgt.backend.productstoreprices.dto.*;
import com.dgt.backend.productstoreprices.entity.ProductPriceGroup;
import com.dgt.backend.productstoreprices.repository.ProductPriceGroupRepository;
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
class ProductPriceGroupServiceTest {

    @Mock ProductPriceGroupRepository repository;
    @InjectMocks ProductPriceGroupService service;

    private ProductPriceGroup sampleEntity() {
        return ProductPriceGroup.builder()
            .productPriceGroupId(1L)
            .priceGroupId(10L)
            .productId(20L)
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<ProductPriceGroupResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        ProductPriceGroupResponse result = service.get(1L);
        assertThat(result.productPriceGroupId()).isEqualTo(1L);
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
        var req = new CreateProductPriceGroupRequest(10L, 20L);
        when(repository.save(any(ProductPriceGroup.class))).thenReturn(sampleEntity());
        ProductPriceGroupResponse result = service.create(req);
        assertThat(result.productPriceGroupId()).isEqualTo(1L);
        verify(repository).save(any(ProductPriceGroup.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateProductPriceGroupRequest(null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
