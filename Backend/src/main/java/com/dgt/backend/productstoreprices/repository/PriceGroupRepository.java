package com.dgt.backend.productstoreprices.repository;
import com.dgt.backend.productstoreprices.entity.PriceGroup;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the price group entity using a Long primary key.
public interface PriceGroupRepository extends JpaRepository<PriceGroup, Long> {}
