package com.dgt.backend.vendors.service;

import com.dgt.backend.vendors.dto.*;
import com.dgt.backend.vendors.entity.Vendor;
import com.dgt.backend.vendors.repository.VendorRepository;
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
class VendorServiceTest {

    @Mock VendorRepository repository;
    @InjectMocks VendorService service;

    private Vendor sampleEntity() {
        return Vendor.builder()
            .vendorId(1L)
            .vendorName("Acme Corp")
            .email("vendor@acme.com")
            .isActive(true)
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        var pageData = new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1);
        when(repository.findAll(any(Pageable.class))).thenReturn(pageData);
        PageResponse<VendorResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        VendorResponse result = service.get(1L);
        assertThat(result.vendorId()).isEqualTo(1L);
        assertThat(result.vendorName()).isEqualTo("Acme Corp");
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
    void create_savesAndReturns() {
        var req = new CreateVendorRequest("Acme Corp", "vendor@acme.com", null, null, null, null, true);
        when(repository.save(any(Vendor.class))).thenReturn(sampleEntity());
        VendorResponse result = service.create(req);
        assertThat(result.vendorName()).isEqualTo("Acme Corp");
        verify(repository).save(any(Vendor.class));
    }

    @Test
    void update_existingId_appliesChanges() {
        var req = new UpdateVendorRequest("New Corp", null, null, null, null, null, null);
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        assertThat(service.update(1L, req)).isNotNull();
        assertThat(entity.getVendorName()).isEqualTo("New Corp");
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateVendorRequest(null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
