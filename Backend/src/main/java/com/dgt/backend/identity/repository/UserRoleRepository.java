package com.dgt.backend.identity.repository;
import com.dgt.backend.identity.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {}
