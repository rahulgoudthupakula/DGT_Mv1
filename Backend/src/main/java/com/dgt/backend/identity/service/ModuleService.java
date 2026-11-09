package com.dgt.backend.identity.service;

import com.dgt.backend.identity.dto.ModuleResponse;
import com.dgt.backend.identity.dto.CreateModuleRequest;
import com.dgt.backend.identity.dto.UpdateModuleRequest;
import com.dgt.backend.identity.entity.Module;
import com.dgt.backend.identity.repository.ModuleRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA CRUD operations for Module.
 * The caller is responsible for authorization and workflow validation; these queries add no store predicate.
 */

@Slf4j
@Service
public class ModuleService {
    private final ModuleRepository repository;
    public ModuleService(ModuleRepository repository) { this.repository = repository; }

    /** Load a page sorted by primary key and map its records to response DTOs. */
    public PageResponse<ModuleResponse> list(int page, int size) {
        log.debug("Listing module page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("moduleId")));
        log.debug("Module list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(ModuleResponse::from).toList(), page, size, p.getTotalElements());
    }

    /** Load a record by ID or return HTTP 404. */
    public ModuleResponse get(Long id) {
        log.debug("Fetching module id={}", id);
        return ModuleResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Module not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    /** Persist the supplied fields in one transaction and return the saved values. */
    @Transactional
    public ModuleResponse create(CreateModuleRequest req) {
        log.info("Creating module");
        var entity = Module.builder()
                .moduleName(req.moduleName())
                .submoduleName(req.submoduleName())
                .description(req.description())
                .isActive(req.isActive())
                .build();
        var saved = repository.save(entity);
        log.info("Created module id={}", saved.getModuleId());
        return ModuleResponse.from(saved);
    }

    /** Apply only non-null fields in one transaction, leaving omitted fields unchanged. */
    @Transactional
    public ModuleResponse update(Long id, UpdateModuleRequest req) {
        log.info("Updating module id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Module not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.moduleName() != null) entity.setModuleName(req.moduleName());
        if (req.submoduleName() != null) entity.setSubmoduleName(req.submoduleName());
        if (req.description() != null) entity.setDescription(req.description());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        var saved = repository.save(entity);
        log.info("Updated module id={}", id);
        return ModuleResponse.from(saved);
    }
}
