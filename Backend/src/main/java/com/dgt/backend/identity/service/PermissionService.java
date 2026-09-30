package com.dgt.backend.identity.service;

import com.dgt.backend.identity.dto.PermissionResponse;
import com.dgt.backend.identity.dto.CreatePermissionRequest;
import com.dgt.backend.identity.dto.UpdatePermissionRequest;
import com.dgt.backend.identity.entity.Permission;
import com.dgt.backend.identity.repository.PermissionRepository;
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
public class PermissionService {
    private final PermissionRepository repository;
    public PermissionService(PermissionRepository repository) { this.repository = repository; }

    public PageResponse<PermissionResponse> list(int page, int size) {
        log.debug("Listing permission page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("permissionId")));
        log.debug("Permission list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(PermissionResponse::from).toList(), page, size, p.getTotalElements());
    }

    public PermissionResponse get(Long id) {
        log.debug("Fetching permission id={}", id);
        return PermissionResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Permission not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public PermissionResponse create(CreatePermissionRequest req) {
        log.info("Creating permission");
        var entity = Permission.builder()
                .moduleId(req.moduleId())
                .userRoleId(req.userRoleId())
                .isActive(req.isActive())
                .canView(req.canView())
                .canEdit(req.canEdit())
                .build();
        var saved = repository.save(entity);
        log.info("Created permission id={}", saved.getPermissionId());
        return PermissionResponse.from(saved);
    }

    @Transactional
    public PermissionResponse update(Long id, UpdatePermissionRequest req) {
        log.info("Updating permission id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Permission not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.moduleId() != null) entity.setModuleId(req.moduleId());
        if (req.userRoleId() != null) entity.setUserRoleId(req.userRoleId());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        if (req.canView() != null) entity.setCanView(req.canView());
        if (req.canEdit() != null) entity.setCanEdit(req.canEdit());
        var saved = repository.save(entity);
        log.info("Updated permission id={}", id);
        return PermissionResponse.from(saved);
    }
}
