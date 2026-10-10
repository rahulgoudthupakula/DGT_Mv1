package com.dgt.backend.lottery.service;

import com.dgt.backend.lottery.dto.*;
import com.dgt.backend.lottery.entity.LotterySettlement;
import com.dgt.backend.lottery.repository.LotterySettlementRepository;
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
class LotterySettlementServiceTest {

    @Mock LotterySettlementRepository repository;
    @InjectMocks LotterySettlementService service;

    private LotterySettlement sampleEntity() {
        return LotterySettlement.builder()
            .lotterySettlementId(1L)
            .dgtId("SAMPLE")
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1));
        PageResponse<LotterySettlementResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        LotterySettlementResponse result = service.get(1L);
        assertThat(result.lotterySettlementId()).isEqualTo(1L);
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
        var req = new CreateLotterySettlementRequest("SAMPLE", null, null, null, null, null, null, null, null, null, null);
        when(repository.save(any(LotterySettlement.class))).thenReturn(sampleEntity());
        LotterySettlementResponse result = service.create(req);
        assertThat(result.lotterySettlementId()).isEqualTo(1L);
        verify(repository).save(any(LotterySettlement.class));
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateLotterySettlementRequest(null, null, null, null, null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
