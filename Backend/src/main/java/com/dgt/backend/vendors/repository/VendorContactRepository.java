package com.dgt.backend.vendors.repository;
import com.dgt.backend.vendors.entity.VendorContact;
import org.springframework.data.jpa.repository.JpaRepository;
// Spring Data supplies CRUD and pagination for the vendor contract/contact record entity using a Long primary key.
public interface VendorContactRepository extends JpaRepository<VendorContact, Long> {}
