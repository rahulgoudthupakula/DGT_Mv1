package com.dgt.backend.identity.service;

import com.dgt.backend.identity.dto.UserResponse;
import com.dgt.backend.identity.dto.CreateUserRequest;
import com.dgt.backend.identity.dto.UpdateUserRequest;
import com.dgt.backend.identity.entity.User;
import com.dgt.backend.identity.repository.UserRepository;
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
public class UserService {
    private final UserRepository repository;
    public UserService(UserRepository repository) { this.repository = repository; }

    public PageResponse<UserResponse> list(int page, int size) {
        log.debug("Listing user page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("userId")));
        log.debug("User list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(UserResponse::from).toList(), page, size, p.getTotalElements());
    }

    public UserResponse get(Long id) {
        log.debug("Fetching user id={}", id);
        return UserResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("User not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public UserResponse create(CreateUserRequest req) {
        log.info("Creating user");
        var entity = User.builder()
                .dgtId(req.dgtId())
                .employeeId(req.employeeId())
                .firstName(req.firstName())
                .lastName(req.lastName())
                .email(req.email())
                .accountStatus(req.accountStatus())
                .twoFactorAuthentication(req.twoFactorAuthentication())
                .build();
        var saved = repository.save(entity);
        log.info("Created user id={}", saved.getUserId());
        return UserResponse.from(saved);
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest req) {
        log.info("Updating user id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("User not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.dgtId() != null) entity.setDgtId(req.dgtId());
        if (req.employeeId() != null) entity.setEmployeeId(req.employeeId());
        if (req.firstName() != null) entity.setFirstName(req.firstName());
        if (req.lastName() != null) entity.setLastName(req.lastName());
        if (req.email() != null) entity.setEmail(req.email());
        if (req.accountStatus() != null) entity.setAccountStatus(req.accountStatus());
        if (req.twoFactorAuthentication() != null) entity.setTwoFactorAuthentication(req.twoFactorAuthentication());
        var saved = repository.save(entity);
        log.info("Updated user id={}", id);
        return UserResponse.from(saved);
    }
}
