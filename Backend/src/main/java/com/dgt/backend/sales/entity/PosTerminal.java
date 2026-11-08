package com.dgt.backend.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.*;

@Entity
@Table(name = "pos_terminals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
// JPA mapping for pos_terminals; related record IDs are scalar fields rather than entity associations.
public class PosTerminal {

    // Database-generated primary key used by the repository.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "terminal_id")
    private Long terminalId;

    @Column(name = "store_id", nullable = false, length = 50)
    private String storeId;

    @Column(name = "terminal_code", nullable = false, length = 50)
    private String terminalCode;

    @Column(name = "terminal_name", nullable = false, length = 100)
    private String terminalName;

    @Column(name = "terminal_status", nullable = false, length = 50)
    private String terminalStatus;

    @Column(name = "created_at", updatable = false)
    // Hibernate populates this timestamp when the entity is first persisted.
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    // Hibernate refreshes this timestamp when the entity is updated.
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
