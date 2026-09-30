package com.dgt.backend.promotions.repository;
import com.dgt.backend.promotions.entity.PromotionProduct;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PromotionProductRepository extends JpaRepository<PromotionProduct, Long> {}
