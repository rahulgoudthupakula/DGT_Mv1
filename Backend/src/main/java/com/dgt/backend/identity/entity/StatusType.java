package com.dgt.backend.identity.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * JPA mapping of status_types.
 * Stores record fields and scalar relationship identifiers; workflow rules live outside this entity.
 */

@Entity
@Table(name = "status_types")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StatusType {

    // Database-generated primary key.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "status_type_id")
    private Long statusTypeId;

    @Column(name = "status_name", nullable = false, length = 100)
    private String statusName;
}
