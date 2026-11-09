package com.dgt.backend.identity.repository;
import com.dgt.backend.identity.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for Module.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface ModuleRepository extends JpaRepository<Module, Long> {}
