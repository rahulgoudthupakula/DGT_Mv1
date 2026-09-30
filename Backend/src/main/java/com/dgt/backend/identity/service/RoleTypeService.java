package com.dgt.backend.identity.service;

import com.dgt.backend.identity.dto.RoleTypeResponse;
import com.dgt.backend.identity.dto.CreateRoleTypeRequest;
import com.dgt.backend.identity.dto.UpdateRoleTypeRequest;
import com.dgt.backend.identity.entity.RoleType;
import com.dgt.backend.identity.repository.RoleTypeRepository;
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
public class RoleTypeService {
    private final RoleTypeRepository repository;
    public RoleTypeService(RoleTypeRepository repository) { this.repository = repository; }

    public PageResponse<RoleTypeResponse> list(int page, int size) {
        log.debug("Listing role type page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("roleTypeId")));
        log.debug("RoleType list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(RoleTypeResponse::from).toList(), page, size, p.getTotalElements());
    }

    public RoleTypeResponse get(Long id) {
        log.debug("Fetching role type id={}", id);
        return RoleTypeResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("RoleType not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public RoleTypeResponse create(CreateRoleTypeRequest req) {
        log.info("Creating role type");
        var entity = RoleType.builder()
                .roleTypeName(req.roleTypeName())
                .description(req.description())
                .isActive(req.isActive())
                .build();
        var saved = repository.save(entity);
        log.info("Created role type id={}", saved.getRoleTypeId());
        return RoleTypeResponse.from(saved);
    }

    @Transactional
    public RoleTypeResponse update(Long id, UpdateRoleTypeRequest req) {
        log.info("Updating role type id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("RoleType not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.roleTypeName() != null) entity.setRoleTypeName(req.roleTypeName());
        if (req.description() != null) entity.setDescription(req.description());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        var saved = repository.save(entity);
        log.info("Updated role type id={}", id);
        return RoleTypeResponse.from(saved);
    }
}
