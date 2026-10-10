package com.dgt.backend.stores.service;

import com.dgt.backend.stores.dto.*;
import com.dgt.backend.stores.entity.StoreContactInfo;
import com.dgt.backend.stores.repository.StoreContactInfoRepository;
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
class StoreContactInfoServiceTest {

    @Mock StoreContactInfoRepository repository;
    @InjectMocks StoreContactInfoService service;

    private StoreContactInfo sampleEntity() {
        return StoreContactInfo.builder()
            .contactInfoId(1L)
            .dgtId("SAMPLE")
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<StoreContactInfoResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        StoreContactInfoResponse result = service.get(1L);
        assertThat(result.contactInfoId()).isEqualTo(1L);
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
        var req = new CreateStoreContactInfoRequest(null, null, null, null, null);
        when(repository.save(any(StoreContactInfo.class))).thenReturn(sampleEntity());
        StoreContactInfoResponse result = service.create(req);
        assertThat(result.contactInfoId()).isEqualTo(1L);
        verify(repository).save(any(StoreContactInfo.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateStoreContactInfoRequest(null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
