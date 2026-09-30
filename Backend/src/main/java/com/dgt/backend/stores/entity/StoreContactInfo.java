package com.dgt.backend.stores.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

@Entity
@Table(name = "store_contact_info")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StoreContactInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contact_info_id")
    private Long contactInfoId;

    @Column(name = "dgt_id", length = 50)
    private String dgtId;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "email", length = 200)
    private String email;

    @Column(name = "address", columnDefinition = "text")
    private String address;

    @Column(name = "store_name", length = 200)
    private String storeName;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
