package com.dgt.backend.sales.service;

import com.dgt.backend.sales.dto.PosTerminalResponse;
import com.dgt.backend.sales.dto.CreatePosTerminalRequest;
import com.dgt.backend.sales.dto.UpdatePosTerminalRequest;
import com.dgt.backend.sales.entity.PosTerminal;
import com.dgt.backend.sales.repository.PosTerminalRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class PosTerminalService {
    private final PosTerminalRepository repository;
    public PosTerminalService(PosTerminalRepository repository) { this.repository = repository; }

    public PageResponse<PosTerminalResponse> list(int page, int size) {
        log.debug("Listing pos terminal page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("terminalId")));
        log.debug("PosTerminal list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(PosTerminalResponse::from).toList(), page, size, p.getTotalElements());
    }

    public PosTerminalResponse get(Long id) {
        log.debug("Fetching pos terminal id={}", id);
        return PosTerminalResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("PosTerminal not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public PosTerminalResponse create(CreatePosTerminalRequest req) {
        log.info("Creating pos terminal");
        var entity = PosTerminal.builder()
                .storeId(req.storeId())
                .terminalCode(req.terminalCode())
                .terminalName(req.terminalName())
                .terminalStatus(req.terminalStatus())
                .build();
        var saved = repository.save(entity);
        log.info("Created pos terminal id={}", saved.getPosTerminalId());
        return PosTerminalResponse.from(saved);
    }

    @Transactional
    public PosTerminalResponse update(Long id, UpdatePosTerminalRequest req) {
        log.info("Updating pos terminal id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("PosTerminal not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.storeId() != null) entity.setStoreId(req.storeId());
        if (req.terminalCode() != null) entity.setTerminalCode(req.terminalCode());
        if (req.terminalName() != null) entity.setTerminalName(req.terminalName());
        if (req.terminalStatus() != null) entity.setTerminalStatus(req.terminalStatus());
        var saved = repository.save(entity);
        log.info("Updated pos terminal id={}", id);
        return PosTerminalResponse.from(saved);
    }
}
