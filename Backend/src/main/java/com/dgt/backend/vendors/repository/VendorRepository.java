package com.dgt.backend.vendors.repository;
import com.dgt.backend.vendors.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the vendor entity using a Long primary key.
public interface VendorRepository extends JpaRepository<Vendor, Long> {}
