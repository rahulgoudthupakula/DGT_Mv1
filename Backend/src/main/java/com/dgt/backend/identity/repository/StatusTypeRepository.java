package com.dgt.backend.identity.repository;
import com.dgt.backend.identity.entity.StatusType;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for StatusType.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface StatusTypeRepository extends JpaRepository<StatusType, Long> {}
