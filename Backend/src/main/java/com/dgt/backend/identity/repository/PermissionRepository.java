package com.dgt.backend.identity.repository;
import com.dgt.backend.identity.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PermissionRepository extends JpaRepository<Permission, Long> {}
