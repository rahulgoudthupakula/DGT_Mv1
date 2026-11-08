package com.dgt.backend.stores.repository;
import com.dgt.backend.stores.entity.StoreBusinessHour;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the store business hours entity using its declared primary-key type.
public interface StoreBusinessHourRepository extends JpaRepository<StoreBusinessHour, Long> {}
