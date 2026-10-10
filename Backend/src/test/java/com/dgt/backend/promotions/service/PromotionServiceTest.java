package com.dgt.backend.promotions.service;

import com.dgt.backend.promotions.dto.*;
import com.dgt.backend.promotions.entity.Promotion;
import com.dgt.backend.promotions.repository.PromotionRepository;
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
class PromotionServiceTest {

    @Mock PromotionRepository repository;
    @InjectMocks PromotionService service;

    private Promotion sampleEntity() {
        return Promotion.builder()
            .promotionId(1L)
            .dgtId("STORE1")
            .promotionName("Summer Sale")
            .promotionType("PERCENT")
            .status("ACTIVE")
            .discountValue(new BigDecimal("10.00"))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<PromotionResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        PromotionResponse result = service.get(1L);
        assertThat(result.promotionId()).isEqualTo(1L);
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
        var req = new CreatePromotionRequest("STORE1", "Summer Sale", "PERCENT", null, null, "ACTIVE", new BigDecimal("10.00"));
        when(repository.save(any(Promotion.class))).thenReturn(sampleEntity());
        PromotionResponse result = service.create(req);
        assertThat(result.promotionId()).isEqualTo(1L);
        verify(repository).save(any(Promotion.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdatePromotionRequest(null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
