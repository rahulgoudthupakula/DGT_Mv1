package com.dgt.backend.promotions.repository;
import com.dgt.backend.promotions.entity.PromotionProduct;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the promotion-product link entity using a Long primary key.
public interface PromotionProductRepository extends JpaRepository<PromotionProduct, Long> {}
