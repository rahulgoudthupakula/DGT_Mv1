package com.dgt.backend.invoices.service;

import com.dgt.backend.invoices.dto.*;
import com.dgt.backend.invoices.entity.GroceryInvoiceItem;
import com.dgt.backend.invoices.repository.GroceryInvoiceItemRepository;
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
class GroceryInvoiceItemServiceTest {

    @Mock GroceryInvoiceItemRepository repository;
    @InjectMocks GroceryInvoiceItemService service;

    private GroceryInvoiceItem sampleEntity() {
        return GroceryInvoiceItem.builder()
            .groceryInvoiceItemId(1L)
            .invoiceId(1L)
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<GroceryInvoiceItemResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        GroceryInvoiceItemResponse result = service.get(1L);
        assertThat(result.groceryInvoiceItemId()).isEqualTo(1L);
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
        var req = new CreateGroceryInvoiceItemRequest(1L, null, null, null, null, null, null, null, null, null, null);
        when(repository.save(any(GroceryInvoiceItem.class))).thenReturn(sampleEntity());
        GroceryInvoiceItemResponse result = service.create(req);
        assertThat(result.groceryInvoiceItemId()).isEqualTo(1L);
        verify(repository).save(any(GroceryInvoiceItem.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateGroceryInvoiceItemRequest(null, null, null, null, null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
