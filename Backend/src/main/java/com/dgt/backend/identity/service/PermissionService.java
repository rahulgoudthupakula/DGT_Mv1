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

@Service
public class PermissionService {
    private final PermissionRepository repository;
    public PermissionService(PermissionRepository repository) { this.repository = repository; }

    public PageResponse<PermissionResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("permissionId")));
        return new PageResponse<>(p.getContent().stream().map(PermissionResponse::from).toList(), page, size, p.getTotalElements());
    }

    public PermissionResponse get(Long id) {
        return PermissionResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public PermissionResponse create(CreatePermissionRequest req) {
        var entity = Permission.builder()
                .moduleId(req.moduleId())
                .userRoleId(req.userRoleId())
                .isActive(req.isActive())
                .canView(req.canView())
                .canEdit(req.canEdit())
                .build();
        return PermissionResponse.from(repository.save(entity));
    }

    @Transactional
    public PermissionResponse update(Long id, UpdatePermissionRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.moduleId() != null) entity.setModuleId(req.moduleId());
        if (req.userRoleId() != null) entity.setUserRoleId(req.userRoleId());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        if (req.canView() != null) entity.setCanView(req.canView());
        if (req.canEdit() != null) entity.setCanEdit(req.canEdit());
        return PermissionResponse.from(repository.save(entity));
    }
}
