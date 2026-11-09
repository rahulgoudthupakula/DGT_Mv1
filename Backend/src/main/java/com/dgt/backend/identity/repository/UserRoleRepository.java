package com.dgt.backend.identity.repository;
import com.dgt.backend.identity.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for UserRole.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {}
