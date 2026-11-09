package com.dgt.backend.identity.repository;
import com.dgt.backend.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data CRUD and pagination for User.
 * No custom store filter is added here; mapped entity restrictions still apply.
 */
public interface UserRepository extends JpaRepository<User, Long> {}
