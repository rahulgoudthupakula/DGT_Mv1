package com.dgt.backend.identity.service;

import com.dgt.backend.identity.dto.UserRoleResponse;
import com.dgt.backend.identity.dto.CreateUserRoleRequest;
import com.dgt.backend.identity.dto.UpdateUserRoleRequest;
import com.dgt.backend.identity.entity.UserRole;
import com.dgt.backend.identity.repository.UserRoleRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserRoleService {
    private final UserRoleRepository repository;
    public UserRoleService(UserRoleRepository repository) { this.repository = repository; }

    public PageResponse<UserRoleResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("userRoleId")));
        return new PageResponse<>(p.getContent().stream().map(UserRoleResponse::from).toList(), page, size, p.getTotalElements());
    }

    public UserRoleResponse get(Long id) {
        return UserRoleResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public UserRoleResponse create(CreateUserRoleRequest req) {
        var entity = UserRole.builder()
                .userId(req.userId())
                .roleTypeId(req.roleTypeId())
                .dgtId(req.dgtId())
                .isActive(req.isActive())
                .build();
        return UserRoleResponse.from(repository.save(entity));
    }

    @Transactional
    public UserRoleResponse update(Long id, UpdateUserRoleRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.userId() != null) entity.setUserId(req.userId());
        if (req.roleTypeId() != null) entity.setRoleTypeId(req.roleTypeId());
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.isActive() != null) entity.setIsActive(req.isActive());
        return UserRoleResponse.from(repository.save(entity));
    }
}
