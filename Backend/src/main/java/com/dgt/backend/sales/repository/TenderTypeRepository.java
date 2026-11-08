package com.dgt.backend.sales.repository;
import com.dgt.backend.sales.entity.TenderType;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the tender type entity using a Long primary key.
public interface TenderTypeRepository extends JpaRepository<TenderType, Long> {}
