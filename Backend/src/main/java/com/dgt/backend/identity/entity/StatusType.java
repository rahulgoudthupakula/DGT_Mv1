package com.dgt.backend.identity.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "status_types")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StatusType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "status_type_id")
    private Long statusTypeId;

    @Column(name = "status_name", nullable = false, length = 100)
    private String statusName;
}
