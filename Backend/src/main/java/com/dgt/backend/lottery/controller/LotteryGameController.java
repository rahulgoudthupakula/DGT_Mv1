package com.dgt.backend.lottery.controller;

import com.dgt.backend.lottery.dto.LotteryGameResponse;
import com.dgt.backend.lottery.dto.CreateLotteryGameRequest;
import com.dgt.backend.lottery.dto.UpdateLotteryGameRequest;
import com.dgt.backend.lottery.service.LotteryGameService;
import com.dgt.backend.common.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/lottery-games")
public class LotteryGameController {
    private final LotteryGameService service;
    public LotteryGameController(LotteryGameService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_games', 'READ')")
    public PageResponse<LotteryGameResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) { return service.list(page, size); }

    @GetMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_games', 'READ')")
    public LotteryGameResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_games', 'WRITE')")
    public LotteryGameResponse create(@Valid @RequestBody CreateLotteryGameRequest request) { return service.create(request); }

    @PatchMapping("/{id}")
    @PreAuthorize("@accessPolicy.check(authentication, 'lottery_games', 'WRITE')")
    public LotteryGameResponse update(@PathVariable Long id, @RequestBody UpdateLotteryGameRequest request) { return service.update(id, request); }
}
