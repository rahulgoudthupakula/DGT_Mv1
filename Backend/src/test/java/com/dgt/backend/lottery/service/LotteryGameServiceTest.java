package com.dgt.backend.lottery.service;

import com.dgt.backend.lottery.dto.*;
import com.dgt.backend.lottery.entity.LotteryGame;
import com.dgt.backend.lottery.repository.LotteryGameRepository;
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
class LotteryGameServiceTest {

    @Mock LotteryGameRepository repository;
    @InjectMocks LotteryGameService service;

    private LotteryGame sampleEntity() {
        return LotteryGame.builder()
            .lotteryGameId(1L)
            .dgtId("DGT-S1")
            .gameCode("G001")
            .gameName("Lucky 7")
            .ticketPrice(new BigDecimal("1.00"))
            .ticketsPerPack(300)
            .packValue(new BigDecimal("300.00"))
            .status("ACTIVE")
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        var pageData = new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1);
        when(repository.findAll(any(Pageable.class))).thenReturn(pageData);
        PageResponse<LotteryGameResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
        assertThat(result.total()).isEqualTo(1L);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        LotteryGameResponse result = service.get(1L);
        assertThat(result.lotteryGameId()).isEqualTo(1L);
        assertThat(result.gameName()).isEqualTo("Lucky 7");
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
        var req = new CreateLotteryGameRequest("DGT-S1", "G001", "Lucky 7",
            new BigDecimal("1.00"), 300, new BigDecimal("300.00"), null, "ACTIVE", null, null);
        when(repository.save(any(LotteryGame.class))).thenReturn(sampleEntity());
        LotteryGameResponse result = service.create(req);
        assertThat(result.lotteryGameId()).isEqualTo(1L);
        verify(repository).save(any(LotteryGame.class));
    }

    @Test
    void update_existingId_appliesChanges() {
        var req = new UpdateLotteryGameRequest(null, null, "Lucky 8", null, null, null, null, null, null, null);
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        assertThat(service.update(1L, req)).isNotNull();
        assertThat(entity.getGameName()).isEqualTo("Lucky 8");
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateLotteryGameRequest(null, null, null, null, null, null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
