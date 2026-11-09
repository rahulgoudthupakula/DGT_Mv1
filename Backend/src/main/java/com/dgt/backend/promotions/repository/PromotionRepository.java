package com.dgt.backend.promotions.repository;
import com.dgt.backend.promotions.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the promotion entity using a Long primary key.
public interface PromotionRepository extends JpaRepository<Promotion, Long> {}
