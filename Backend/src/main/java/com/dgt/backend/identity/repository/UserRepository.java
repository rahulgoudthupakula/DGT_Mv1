package com.dgt.backend.identity.repository;
import com.dgt.backend.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
public interface UserRepository extends JpaRepository<User, Long> {}
