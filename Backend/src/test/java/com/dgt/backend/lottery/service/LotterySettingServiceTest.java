package com.dgt.backend.lottery.service;

import com.dgt.backend.lottery.dto.*;
import com.dgt.backend.lottery.entity.LotterySetting;
import com.dgt.backend.lottery.repository.LotterySettingRepository;
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
class LotterySettingServiceTest {

    @Mock LotterySettingRepository repository;
    @InjectMocks LotterySettingService service;

    private LotterySetting sampleEntity() {
        return LotterySetting.builder()
            .lotterySettingId(1L)
            .dgtId("DGT-S1")
            .maxOpenPacksPerGame(5)
            .allowPartialReturns(true)
            .defaultCommissionPerPack(new BigDecimal("10.00"))
            .build();
    }

    @Test
    void list_returnsPageResponse() {
        var pageData = new PageImpl<>(List.of(sampleEntity()), PageRequest.of(0, 50), 1);
        when(repository.findAll(any(Pageable.class))).thenReturn(pageData);
        PageResponse<LotterySettingResponse> result = service.list(0, 50);
        assertThat(result.items()).hasSize(1);
    }

    @Test
    void get_existingId_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntity()));
        LotterySettingResponse result = service.get(1L);
        assertThat(result.lotterySettingId()).isEqualTo(1L);
        assertThat(result.dgtId()).isEqualTo("DGT-S1");
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
        var req = new CreateLotterySettingRequest("DGT-S1", 5, true, new BigDecimal("10.00"), null);
        when(repository.save(any(LotterySetting.class))).thenReturn(sampleEntity());
        LotterySettingResponse result = service.create(req);
        assertThat(result.dgtId()).isEqualTo("DGT-S1");
        verify(repository).save(any(LotterySetting.class));
    }

    @Test
    void update_existingId_appliesChanges() {
        var req = new UpdateLotterySettingRequest(null, 10, null, null, null);
        var entity = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        assertThat(service.update(1L, req)).isNotNull();
        assertThat(entity.getMaxOpenPacksPerGame()).isEqualTo(10);
    }

    @Test
    void update_nonExistingId_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(99L, new UpdateLotterySettingRequest(null, null, null, null, null)))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
