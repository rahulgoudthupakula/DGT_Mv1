package com.dgt.backend.vendors.service;

import com.dgt.backend.vendors.dto.*;
import com.dgt.backend.vendors.entity.VendorItemCostHistory;
import com.dgt.backend.vendors.repository.VendorItemCostHistoryRepository;
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
class VendorItemCostHistoryServiceTest {

    @Mock VendorItemCostHistoryRepository repository;
    @InjectMocks VendorItemCostHistoryService service;

    private VendorItemCostHistory sampleEntity() {
        return VendorItemCostHistory.builder()
            .costHistoryId(1L)
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<VendorItemCostHistoryResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        VendorItemCostHistoryResponse result = service.get(1L);
        assertThat(result.costHistoryId()).isEqualTo(1L);
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
        var req = new CreateVendorItemCostHistoryRequest(null, null, null, null, null, null, null, null);
        when(repository.save(any(VendorItemCostHistory.class))).thenReturn(sampleEntity());
        VendorItemCostHistoryResponse result = service.create(req);
        assertThat(result.costHistoryId()).isEqualTo(1L);
        verify(repository).save(any(VendorItemCostHistory.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateVendorItemCostHistoryRequest(null, null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
