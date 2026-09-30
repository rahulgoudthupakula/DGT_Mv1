package com.dgt.backend.stores.repository;
import com.dgt.backend.stores.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
public interface StoreRepository extends JpaRepository<Store, String> {}
