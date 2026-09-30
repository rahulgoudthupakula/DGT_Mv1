package com.dgt.backend.promotions.repository;
import com.dgt.backend.promotions.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PromotionRepository extends JpaRepository<Promotion, Long> {}
