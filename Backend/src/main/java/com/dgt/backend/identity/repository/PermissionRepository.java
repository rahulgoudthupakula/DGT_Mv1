package com.dgt.backend.identity.repository;
import com.dgt.backend.identity.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for Permission.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface PermissionRepository extends JpaRepository<Permission, Long> {}
