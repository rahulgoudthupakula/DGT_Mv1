package com.dgt.backend.identity.repository;
import com.dgt.backend.identity.entity.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for RoleType.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface RoleTypeRepository extends JpaRepository<RoleType, Long> {}
