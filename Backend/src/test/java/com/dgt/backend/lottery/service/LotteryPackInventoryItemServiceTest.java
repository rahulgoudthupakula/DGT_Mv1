package com.dgt.backend.lottery.service;

import com.dgt.backend.lottery.dto.*;
import com.dgt.backend.lottery.entity.LotteryPackInventoryItem;
import com.dgt.backend.lottery.repository.LotteryPackInventoryItemRepository;
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
class LotteryPackInventoryItemServiceTest {

    @Mock LotteryPackInventoryItemRepository repository;
    @InjectMocks LotteryPackInventoryItemService service;

    private LotteryPackInventoryItem sampleEntity() {
        return LotteryPackInventoryItem.builder()
            .lotteryPackInventoryItemId(1L)
            .lotteryPackInventoryId(1L)
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<LotteryPackInventoryItemResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        LotteryPackInventoryItemResponse result = service.get(1L);
        assertThat(result.lotteryPackInventoryItemId()).isEqualTo(1L);
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
        var req = new CreateLotteryPackInventoryItemRequest(1L, 1, 1, 1, 1L,
                new BigDecimal("1.00"), new BigDecimal("1.00"));
        when(repository.save(any(LotteryPackInventoryItem.class))).thenReturn(sampleEntity());
        LotteryPackInventoryItemResponse result = service.create(req);
        assertThat(result.lotteryPackInventoryItemId()).isEqualTo(1L);
        verify(repository).save(any(LotteryPackInventoryItem.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateLotteryPackInventoryItemRequest(null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
