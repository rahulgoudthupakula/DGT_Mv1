package com.dgt.backend.vendors.repository;
import com.dgt.backend.vendors.entity.VendorItemCostHistory;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the vendor cost history entity using a Long primary key.
public interface VendorItemCostHistoryRepository extends JpaRepository<VendorItemCostHistory, Long> {}
