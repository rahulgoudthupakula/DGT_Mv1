package com.dgt.backend.products.repository;
import com.dgt.backend.products.entity.NewArrival;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the new-arrival entity using a Long primary key.
public interface NewArrivalRepository extends JpaRepository<NewArrival, Long> {}
